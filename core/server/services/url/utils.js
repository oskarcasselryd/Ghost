'use strict';

// Contains all path information to be used throughout the codebase.
// Assumes that config.url is set, and is valid
const moment = require('moment-timezone'),
    _ = require('lodash'),
    url = require('url'),
    cheerio = require('cheerio'),
    config = require('../../config'),
    settingsCache = require('../settings/cache'),
    // @TODO: unify this with the path in server/app.js
    API_PATH = '/ghost/api/v0.1/',
    STATIC_IMAGE_URL_PREFIX = 'content/images';

/**
 * Returns the base URL of the blog as set in the config.
 *
 * Secure:
 * If the request is secure, we want to force returning the blog url as https.
 * Imagine Ghost runs with http, but nginx allows SSL connections.
 *
 * @param {boolean} secure
 * @return {string} URL returns the url as defined in config, but always with a trailing `/`
 */
function getBlogUrl(secure) {
    var blogUrl;

    if (secure) {
        blogUrl = config.get('url').replace('http://', 'https://');
    } else {
        blogUrl = config.get('url');
    }

    if (!blogUrl.match(/\/$/)) {
        blogUrl += '/';
    }

    return blogUrl;
}

/**
 * Returns a subdirectory URL, if defined so in the config.
 * @return {string} URL a subdirectory if configured.
 */
function getSubdir() {
    // Parse local path location
    var localPath = url.parse(config.get('url')).path,
        subdir;

    // Remove trailing slash
    if (localPath !== '/') {
        localPath = localPath.replace(/\/$/, '');
    }

    subdir = localPath === '/' ? '' : localPath;
    return subdir;
}

function deduplicateSubDir(url) {
    var subDir = getSubdir(),
        subDirRegex;

    if (!subDir) {
        return url;
    }

    subDir = subDir.replace(/^\/|\/+$/, '');
    subDirRegex = new RegExp(subDir + '\/' + subDir + '\/');

    return url.replace(subDirRegex, subDir + '/');
}

function getProtectedSlugs() {
    var subDir = getSubdir();

    if (!_.isEmpty(subDir)) {
        return config.get('slugs').protected.concat([subDir.split('/').pop()]);
    } else {
        return config.get('slugs').protected;
    }
}

/** urlJoin
 * Returns a URL/path for internal use in Ghost.
 * @param {string} arguments takes arguments and concats those to a valid path/URL.
 * @return {string} URL concatinated URL/path of arguments.
 */
function urlJoin() {
    var args = Array.prototype.slice.call(arguments),
        prefixDoubleSlash = false,
        url;

    // Remove empty item at the beginning
    if (args[0] === '') {
        args.shift();
    }

    // Handle schemeless protocols
    if (args[0].indexOf('//') === 0) {
        prefixDoubleSlash = true;
    }

    // join the elements using a slash
    url = args.join('/');

    // Fix multiple slashes
    url = url.replace(/(^|[^:])\/\/+/g, '$1/');

    // Put the double slash back at the beginning if this was a schemeless protocol
    if (prefixDoubleSlash) {
        url = url.replace(/^\//, '//');
    }

    url = deduplicateSubDir(url);
    return url;
}

/**
 * admin:url is optional
 */
function getAdminUrl() {
    var adminUrl = config.get('admin:url'),
        subDir = getSubdir();

    if (!adminUrl) {
        return;
    }

    if (!adminUrl.match(/\/$/)) {
        adminUrl += '/';
    }

    adminUrl = urlJoin(adminUrl, subDir, '/');
    adminUrl = deduplicateSubDir(adminUrl);
    return adminUrl;
}

// ## createUrl
// Simple url creation from a given path
// Ensures that our urls contain the subdirectory if there is one
// And are correctly formatted as either relative or absolute
// Usage:
// createUrl('/', true) -> http://my-ghost-blog.com/
// E.g. /blog/ subdir
// createUrl('/welcome-to-ghost/') -> /blog/welcome-to-ghost/
// Parameters:
// - urlPath - string which must start and end with a slash
// - absolute (optional, default:false) - boolean whether or not the url should be absolute
// - secure (optional, default:false) - boolean whether or not to force SSL
// Returns:
//  - a URL which always ends with a slash
function createUrl(urlPath, absolute, secure) {
    urlPath = urlPath || '/';
    absolute = absolute || false;
    var base;

    // create base of url, always ends without a slash
    if (absolute) {
        base = getBlogUrl(secure);
    } else {
        base = getSubdir();
    }

    return urlJoin(base, urlPath);
}

/**
 * creates the url path for a post based on blog timezone and permalink pattern
 *
 * @param {JSON} post
 * @returns {string}
 */
function urlPathForPost(post) {
    var output = '',
        permalinks = settingsCache.get('permalinks'),
        primaryTagFallback = config.get('routeKeywords').primaryTagFallback,
        publishedAtMoment = moment.tz(post.published_at || Date.now(), settingsCache.get('active_timezone')),
        tags = {
            year: function () {
                return publishedAtMoment.format('YYYY');
            },
            month: function () {
                return publishedAtMoment.format('MM');
            },
            day: function () {
                return publishedAtMoment.format('DD');
            },
            author: function () {
                return post.author.slug;
            },
            primary_tag: function () {
                return post.primary_tag ? post.primary_tag.slug : primaryTagFallback;
            },
            slug: function () {
                return post.slug;
            },
            id: function () {
                return post.id;
            }
        };

    if (post.page) {
        output += '/:slug/';
    } else {
        output += permalinks;
    }

    // replace tags like :slug or :year with actual values
    output = output.replace(/(:[a-z_]+)/g, function (match) {
        if (_.has(tags, match.substr(1))) {
            return tags[match.substr(1)]();
        }
    });

    return output;
}

// ## urlFor
// Synchronous url creation for a given context
// Can generate a url for a named path, given path, or known object (post)
// Determines what sort of context it has been given, and delegates to the correct generation method,
// Finally passing to createUrl, to ensure any subdirectory is honoured, and the url is absolute if needed
// Usage:
// urlFor('home', true) -> http://my-ghost-blog.com/
// E.g. /blog/ subdir
// urlFor({relativeUrl: '/my-static-page/'}) -> /blog/my-static-page/
// E.g. if post object represents welcome post, and slugs are set to standard
// urlFor('post', {...}) -> /welcome-to-ghost/
// E.g. if post object represents welcome post, and slugs are set to date
// urlFor('post', {...}) -> /2014/01/01/welcome-to-ghost/
// Parameters:
// - context (optional, default: '') - a string, or json object describing the context for which you need a url
// - data (optional, default: {}) - a json object containing data needed to generate a url
// - absolute (optional, default:false) - boolean whether or not the url should be absolute
// - coverage (optional, default: []) - only used for coverage tests
// This is probably not the right place for this, but it's the best place for now
// @TODO: rewrite, very hard to read, create private functions!
function urlFor(context = '', data = {}, absolute = false, coverage = []) {
    var urlPath = '/',
        secure, imagePathRe,
        knownObjects = ['post', 'tag', 'author', 'image', 'nav'], baseUrl,
        hostname,

        // this will become really big
        knownPaths = {
            home: '/',
            rss: '/rss/',
            api: API_PATH,
            sitemap_xsl: '/sitemap.xsl'
        };

    // Make data properly optional
    if (_.isBoolean(data)) {
        coverage[0] = true;

        absolute = data;
        data = null;
    }

    // Can pass 'secure' flag in either context or data arg
    var isContextSecure = context;
    if (isContextSecure) {
        coverage[1] = true;

        isContextSecure = context.secure;
    }

    var isDataSecure = data;
    if (isDataSecure) {
        coverage[3] = true;

        isDataSecure = data.secure;
    }

    if (isContextSecure) {
        secure = isContextSecure;
    } else {
        coverage[2] = true;

        secure = isDataSecure;
    }

    var isRelative = _.isObject(context);
    if (isRelative) {
        coverage[4] = true;

        isRelative = context.relativeUrl;
    }

    var contextIsKnownObject = _.isString(context);
    if (contextIsKnownObject) {
        coverage[6] = true;

        contextIsKnownObject = _.indexOf(knownObjects, context) !== -1;
    }

    var isHomeAndAbsolute = context === 'home';
    if (isHomeAndAbsolute) {
        coverage[24] = true;

        isHomeAndAbsolute = absolute;
    }

    var contextIsKnownPath = _.isString(context);
    if (contextIsKnownPath) {
        coverage[37] = true;

        contextIsKnownPath = _.indexOf(_.keys(knownPaths), context) !== -1;
    }

    if (isRelative) {
        coverage[5] = true;

        urlPath = context.relativeUrl;
    } else if (contextIsKnownObject) {
        coverage[7] = true;

        var isPost = context === 'post';
        if (isPost) {
            coverage[8] = true;

            isPost = data.post;
        }

        var isTag = context === 'tag';
        if (isTag) {
            coverage[10] = true;

            isTag = data.tag;
        }

        var isAuthor = context === 'author';
        if (isAuthor) {
            coverage[12] = true;

            isAuthor = data.author;
        }

        var isImage = context === 'image';
        if (isImage) {
            coverage[14] = true;

            isImage = data.image;
        }

        var isNav = context === 'nav';
        if (isNav) {
            coverage[18] = true;

            isNav = data.nav;
        }

        // trying to create a url for an object
        if (isPost) {
            coverage[9] = true;

            urlPath = data.post.url;
            secure = data.secure;
        } else if (isTag) {
            coverage[11] = true;

            urlPath = urlJoin('/', config.get('routeKeywords').tag, data.tag.slug, '/');
            secure = data.tag.secure;
        } else if (isAuthor) {
            coverage[13] = true;

            urlPath = urlJoin('/', config.get('routeKeywords').author, data.author.slug, '/');
            secure = data.author.secure;
        } else if (isImage) {
            coverage[15] = true;

            urlPath = data.image;
            imagePathRe = new RegExp('^' + getSubdir() + '/' + STATIC_IMAGE_URL_PREFIX);

            if (!imagePathRe.test(data.image)) {
                coverage[16] = true;

                absolute = false;
            }

            if (absolute) {
                coverage[17] = true;

                // Remove the sub-directory from the URL because ghostConfig will add it back.
                urlPath = urlPath.replace(new RegExp('^' + getSubdir()), '');
                baseUrl = getBlogUrl(secure).replace(/\/$/, '');
                urlPath = baseUrl + urlPath;
            }

            return urlPath;
        } else if (isNav) {
            coverage[19] = true;

            urlPath = data.nav.url;

            if (data.nav.secure) {
                coverage[20] = true;

                secure = data.nav.secure;
            }

            baseUrl = getBlogUrl(secure);
            hostname = baseUrl.split('//')[1];

            // If the hostname is present in the url
            if (urlPath.indexOf(hostname) > -1) {
                coverage[21] = true;

                // do no not apply, if there is a subdomain, or a mailto link
                if (!urlPath.split(hostname)[0].match(/\.|mailto:/)) {
                    coverage[22] = true;

                    // do not apply, if there is a port after the hostname
                    if(urlPath.split(hostname)[1].substring(0, 1) !== ':') {
                        coverage[23] = true;

                        // make link relative to account for possible mismatch in http/https etc, force absolute
                        urlPath = urlPath.split(hostname)[1];
                        urlPath = urlJoin('/', urlPath);
                        absolute = true;
                    }
                }
            }
        }
    } else if (isHomeAndAbsolute) {
        coverage[25] = true;

        urlPath = getBlogUrl(secure);

        // CASE: there are cases where urlFor('home') needs to be returned without trailing
        // slash e. g. the `{{@blog.url}}` helper. See https://github.com/TryGhost/Ghost/issues/8569
        if (data) {
            coverage[26] = true;

            if (data.trailingSlash === false) {
                coverage[27] = true;

                urlPath = urlPath.replace(/\/$/, '');
            }
        }
    } else if (context === 'admin') {
        coverage[28] = true;

        if (getAdminUrl()) {
            coverage[29] = true;

            urlPath = getAdminUrl();
        } else {
            urlPath = getBlogUrl();
        }

        if (absolute) {
            coverage[30] = true;

            urlPath += 'ghost/';
        } else {
            urlPath = '/ghost/';
        }
    } else if (context === 'api') {
        coverage[31] = true;

        if (getAdminUrl()) {
            coverage[32] = true;

            urlPath = getAdminUrl();
        } else {
            urlPath = getBlogUrl();
        }

        // CASE: with or without protocol? If your blog url (or admin url) is configured to http, it's still possible that e.g. nginx allows both https+http.
        // So it depends how you serve your blog. The main focus here is to avoid cors problems.
        // @TODO: rename cors
        if (data) {
            coverage[33] = true;

            if (data.cors) {
                coverage[34] = true;

                if (!urlPath.match(/^https:/)) {
                    coverage[35] = true;

                    urlPath = urlPath.replace(/^.*?:\/\//g, '//');
                }
            }
        }

        if (absolute) {
            coverage[36] = true;

            urlPath = urlPath.replace(/\/$/, '') + API_PATH;
        } else {
            urlPath = API_PATH;
        }
    } else if (contextIsKnownPath) {
        coverage[38] = true;

        // trying to create a url for a named path
        urlPath = knownPaths[context];
    }

    // This url already has a protocol so is likely an external url to be returned
    // or it is an alternative scheme, protocol-less, or an anchor-only path
    if (urlPath) {
        coverage[39] = true;

        var urlPathBool = urlPath.indexOf('://') !== -1;
        if (urlPathBool) {
            coverage[40] = true;
        } else {
            urlPathBool = urlPath.match(/^(\/\/|#|[a-zA-Z0-9\-]+:)/);
        }

        if (urlPathBool) {
            coverage[41] = true;

            return urlPath;
        }
    }

    return createUrl(urlPath, absolute, secure);
}

function isSSL(urlToParse) {
    var protocol = url.parse(urlToParse).protocol;
    return protocol === 'https:';
}

function redirect301(res, redirectUrl) {
    res.set({'Cache-Control': 'public, max-age=' + config.get('caching:301:maxAge')});
    return res.redirect(301, redirectUrl);
}

function redirectToAdmin(status, res, adminPath) {
    var redirectUrl = urlJoin(urlFor('admin'), adminPath, '/');

    if (status === 301) {
        return redirect301(res, redirectUrl);
    }
    return res.redirect(redirectUrl);
}

/**
 * Make absolute URLs
 * @param {string} html
 * @param {string} siteUrl (blog URL)
 * @param {string} itemUrl (URL of current context)
 * @returns {object} htmlContent
 * @description Takes html, blog url and item url and converts relative url into
 * absolute urls. Returns an object. The html string can be accessed by calling `html()` on
 * the variable that takes the result of this function
 */
function makeAbsoluteUrls(html, siteUrl, itemUrl) {
    var htmlContent = cheerio.load(html, {decodeEntities: false});

    // convert relative resource urls to absolute
    ['href', 'src'].forEach(function forEach(attributeName) {
        htmlContent('[' + attributeName + ']').each(function each(ix, el) {
            var baseUrl,
                attributeValue,
                parsed;

            el = htmlContent(el);

            attributeValue = el.attr(attributeName);

            // if URL is absolute move on to the next element
            try {
                parsed = url.parse(attributeValue);

                if (parsed.protocol) {
                    return;
                }

                // Do not convert protocol relative URLs
                if (attributeValue.lastIndexOf('//', 0) === 0) {
                    return;
                }
            } catch (e) {
                return;
            }

            // CASE: don't convert internal links
            if (attributeValue[0] === '#') {
                return;
            }
            // compose an absolute URL

            // if the relative URL begins with a '/' use the blog URL (including sub-directory)
            // as the base URL, otherwise use the post's URL.
            baseUrl = attributeValue[0] === '/' ? siteUrl : itemUrl;
            attributeValue = urlJoin(baseUrl, attributeValue);
            el.attr(attributeName, attributeValue);
        });
    });

    return htmlContent;
}

module.exports.makeAbsoluteUrls = makeAbsoluteUrls;
module.exports.getProtectedSlugs = getProtectedSlugs;
module.exports.getSubdir = getSubdir;
module.exports.urlJoin = urlJoin;
module.exports.urlFor = urlFor;
module.exports.isSSL = isSSL;
module.exports.urlPathForPost = urlPathForPost;
module.exports.redirectToAdmin = redirectToAdmin;
module.exports.redirect301 = redirect301;

/**
 * If you request **any** image in Ghost, it get's served via
 * http://your-blog.com/content/images/2017/01/02/author.png
 *
 * /content/images/ is a static prefix for serving images!
 *
 * But internally the image is located for example in your custom content path:
 * my-content/another-dir/images/2017/01/02/author.png
 */
module.exports.STATIC_IMAGE_URL_PREFIX = STATIC_IMAGE_URL_PREFIX;
