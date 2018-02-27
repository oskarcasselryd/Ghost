// # Ghost Head Helper
// Usage: `{{ghost_head}}`
//
// Outputs scripts and other assets at the top of a Ghost theme
var proxy = require('./proxy'),
    _ = require('lodash'),
    debug = require('ghost-ignition').debug('ghost_head'),

    getMetaData = proxy.metaData.get,
    getAssetUrl = proxy.metaData.getAssetUrl,
    escapeExpression = proxy.escapeExpression,
    SafeString = proxy.SafeString,
    filters = proxy.filters,
    logging = proxy.logging,
    settingsCache = proxy.settingsCache,
    config = proxy.config,
    blogIconUtils = proxy.blogIcon;

function writeMetaTag(property, content, type) {
    type = type || property.substring(0, 7) === 'twitter' ? 'name' : 'property';
    return '<meta ' + type + '="' + property + '" content="' + content + '" />';
}

function finaliseStructuredData(metaData) {
    var head = [];

    _.each(metaData.structuredData, function (content, property) {
        if (property === 'article:tag') {
            _.each(metaData.keywords, function (keyword) {
                if (keyword !== '') {
                    keyword = escapeExpression(keyword);
                    head.push(writeMetaTag(property,
                        escapeExpression(keyword)));
                }
            });
            head.push('');
        } else if (content !== null && content !== undefined) {
            head.push(writeMetaTag(property,
                escapeExpression(content)));
        }
    });

    return head;
}

function getAjaxHelper(clientId, clientSecret) {
    return '<script type="text/javascript" src="' +
        getAssetUrl('public/ghost-sdk.js', true) +
        '"></script>\n' +
        '<script type="text/javascript">\n' +
        'ghost.init({\n' +
        '\tclientId: "' + clientId + '",\n' +
        '\tclientSecret: "' + clientSecret + '"\n' +
        '});\n' +
        '</script>';
}

/**
 * **NOTE**
 * Express adds `_locals`, see https://github.com/expressjs/express/blob/4.15.4/lib/response.js#L962.
 * But `options.data.root.context` is available next to `root._locals.context`, because
 * Express creates a `renderOptions` object, see https://github.com/expressjs/express/blob/4.15.4/lib/application.js#L554
 * and merges all locals to the root of the object. Very confusing, because the data is available in different layers.
 *
 * Express forwards the data like this to the hbs engine:
 * {
 *   post: {},             - res.render('view', databaseResponse)
 *   context: ['post'],    - from res.locals
 *   safeVersion: '1.x',   - from res.locals
 *   _locals: {
 *     context: ['post'],
 *     safeVersion: '1.x'
 *   }
 * }
 *
 * hbs forwards the data to any hbs helper like this
 * {
 *   data: {
 *     blog: {},
 *     labs: {},
 *     config: {},
 *     root: {
 *       post: {},
 *       context: ['post'],
 *       locals: {...}
 *     }
 *  }
 *
 * `blog`, `labs` and `config` are the templateOptions, search for `hbs.updateTemplateOptions` in the code base.
 *  Also see how the root object get's created, https://github.com/wycats/handlebars.js/blob/v4.0.6/lib/handlebars/runtime.js#L259
 */
// We use the name ghost_head to match the helper for consistency:
module.exports = function ghost_head(options) { // eslint-disable-line camelcase
    debug('begin');

    // if server error page do nothing
    if (options.data.root.statusCode >= 500) {
        return;
    }

    var head = [],
        dataRoot = options.data.root,
        context = dataRoot._locals.context ? dataRoot._locals.context : null,
        client = dataRoot._locals.client,
        safeVersion = dataRoot._locals.safeVersion,
        postCodeInjection = dataRoot && dataRoot.post ? dataRoot.post.codeinjection_head : null,
        globalCodeinjection = settingsCache.get('ghost_head'),
        useStructuredData = !config.isPrivacyDisabled('useStructuredData'),
        referrerPolicy = config.get('referrerPolicy') ? config.get('referrerPolicy') : 'no-referrer-when-downgrade',
        favicon = blogIconUtils.getIconUrl(),
        iconType = blogIconUtils.getIconType(favicon);

    debug('preparation complete, begin fetch');

    /**
     * @TODO:
     *   - getMetaData(dataRoot, dataRoot) -> yes that looks confusing!
     *   - there is a very mixed usage of `data.context` vs. `root.context` vs `root._locals.context` vs. `this.context`
     *   - NOTE: getMetaData won't live here anymore soon, see https://github.com/TryGhost/Ghost/issues/8995
     *   - therefor we get rid of using `getMetaData(this, dataRoot)`
     *   - dataRoot has access to *ALL* locals, see function description
     *   - it should not break anything
     */
    return getMetaData(dataRoot, dataRoot)
        .then(function handleMetaData(metaData) {
            debug('end fetch');

            if (context) {
                console.log('HandleMetaData - Reached branch #1');

                // head is our main array that holds our meta data
                if (metaData.metaDescription) {
                    console.log('HandleMetaData - Reached branch #2');

                    if (metaData.metaDescription.length > 0) {
                        console.log('HandleMetaData - Reached branch #3');

                        head.push('<meta name="description" content="' + escapeExpression(metaData.metaDescription) + '" />');
                    }
                }

                head.push('<link rel="shortcut icon" href="' + favicon + '" type="image/' + iconType + '" />');
                head.push('<link rel="canonical" href="' +
                    escapeExpression(metaData.canonicalUrl) + '" />');
                head.push('<meta name="referrer" content="' + referrerPolicy + '" />');

                // show amp link in post when 1. we are not on the amp page and 2. amp is enabled
                if (_.includes(context, 'post')) {
                    console.log('HandleMetaData - Reached branch #4');

                    if (!_.includes(context, 'amp')) {
                        console.log('HandleMetaData - Reached branch #5');

                        if (settingsCache.get('amp')) {
                            console.log('HandleMetaData - Reached branch #6');

                            head.push('<link rel="amphtml" href="' +
                                escapeExpression(metaData.ampUrl) + '" />');
                        }
                    }
                }

                if (metaData.previousUrl) {
                    console.log('HandleMetaData - Reached branch #7');

                    head.push('<link rel="prev" href="' +
                        escapeExpression(metaData.previousUrl) + '" />');
                }

                if (metaData.nextUrl) {
                    console.log('HandleMetaData - Reached branch #8');

                    head.push('<link rel="next" href="' +
                        escapeExpression(metaData.nextUrl) + '" />');
                }

                if (!_.includes(context, 'paged')) {
                    console.log('HandleMetaData - Reached branch #9');

                    if (useStructuredData) {
                        console.log('HandleMetaData - Reached branch #10');

                        head.push('');
                        head.push.apply(head, finaliseStructuredData(metaData));
                        head.push('');

                        if (metaData.schema) {
                            console.log('HandleMetaData - Reached branch #11');

                            head.push('<script type="application/ld+json">\n' +
                                JSON.stringify(metaData.schema, null, '    ') +
                                '\n    </script>\n');
                        }
                    }
                }

                if (client) {
                    console.log('HandleMetaData - Reached branch #12');

                    if (client.id) {
                        console.log('HandleMetaData - Reached branch #13');

                        if (client.secret) {
                            console.log('HandleMetaData - Reached branch #14');

                            if (!_.includes(context, 'amp')) {
                                console.log('HandleMetaData - Reached branch #15');

                                head.push(getAjaxHelper(client.id, client.secret));
                            }
                        }
                    }
                }
            }

            head.push('<meta name="generator" content="Ghost ' +
                escapeExpression(safeVersion) + '" />');

            head.push('<link rel="alternate" type="application/rss+xml" title="' +
                escapeExpression(metaData.blog.title) + '" href="' +
                escapeExpression(metaData.rssUrl) + '" />');

            // no code injection for amp context!!!
            if (!_.includes(context, 'amp')) {
                console.log('HandleMetaData - Reached branch #16');

                if (!_.isEmpty(globalCodeinjection)) {
                    console.log('HandleMetaData - Reached branch #17');

                    head.push(globalCodeinjection);
                }

                if (!_.isEmpty(postCodeInjection)) {
                    console.log('HandleMetaData - Reached branch #18');

                    head.push(postCodeInjection);
                }
            }
            return filters.doFilter('ghost_head', head);
        })
        .then(function afterFilters(head) {
            debug('end');
            return new SafeString(head.join('\n    ').trim());
        })
        .catch(function handleError(err) {
            logging.error(err);

            // Return what we have so far (currently nothing)
            return new SafeString(head.join('\n    ').trim());
        });
};
