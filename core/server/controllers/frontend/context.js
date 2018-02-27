/**
 * # Response context
 *
 * Figures out which context we are currently serving. The biggest challenge with determining this
 * is that the only way to determine whether or not we are a post, or a page, is with data after all the
 * data for the template has been retrieved.
 *
 * Contexts are determined based on 3 pieces of information
 * 1. res.locals.relativeUrl - which never includes the subdirectory
 * 2. req.params.page - always has the page parameter, regardless of if the URL contains a keyword (RSS pages don't)
 * 3. data - used for telling the difference between posts and pages
 */

var config = require('../../config'),
    labs = require('../../services/labs'),

    // Context patterns, should eventually come from Channel configuration
    privatePattern = new RegExp('^\\/' + config.get('routeKeywords').private + '\\/'),
    subscribePattern = new RegExp('^\\/' + config.get('routeKeywords').subscribe + '\\/'),
    ampPattern = new RegExp('\\/' + config.get('routeKeywords').amp + '\\/$'),
    homePattern = new RegExp('^\\/$');

function setResponseContext(coverage, req, res, data) {
    var pageParam;

    // ---------- COVERAGE ----------
    if (req.params && !(req.params.page !== undefined)) {
        coverage[2] = true;
    }
    // ------------------------------



    if (req.params && req.params.page !== undefined) {
        // Branch #1 and #2
        coverage[1] = true;

        pageParam = parseInt(req.params.page, 10);
    } else {
        pageParam = 1;
    }

    if (res.locals) {
        // Branch #3
        coverage[3] = true;
        res.locals = res.locals;
    } else {
        res.locals = {};
    }
    res.locals.context = [];

    // If we don't have a relativeUrl, we can't detect the context, so return
    if (!res.locals.relativeUrl) {
        // Branch #4
        coverage[4] = true;
        return;
    }

    // ---------- COVERAGE ----------
    if (!isNaN(pageParam) && !(pageParam > 1)) {
        coverage[6] = true;
    }
    //-------------------------------
    // Paged context - special rule
    if (!isNaN(pageParam) && pageParam > 1) {
        // Branch #5 and #6
        coverage[5] = true;
        res.locals.context.push('paged');
    }

    // Home context - special rule
    if (homePattern.test(res.locals.relativeUrl)) {
        // Branch #7
        coverage[7] = true;
        res.locals.context.push('home');
    }

    // ---------- COVERAGE ----------
    if (ampPattern.test(res.locals.relativeUrl) && !data.post) {
        coverage[9] = true;
    }
    //-------------------------------

    // Add context 'amp' to either post or page, if we have an `*/amp` route
    if (ampPattern.test(res.locals.relativeUrl) && data.post) {
        // Branch #8 and #9
        coverage[8] = true;
        res.locals.context.push('amp');
    }

    // ---------- COVERAGE ----------
    if (subscribePattern.test(res.locals.relativeUrl) && !(labs.isSet('subscribers') === true)) {
        coverage[13] = true;
    }

    if (data && !data.post) {
        coverage[15] = true;
    }

    if (data && data.post && !data.post.page) {
        coverage[16] = true;
    }

    if (data && !data.post) {
        coverage[18] = true;
    }

    //-------------------------------

    // Each page can only have at most one of these
    if (res.locals.channel) {
        // Branch #10
        coverage[10] = true;
        res.locals.context = res.locals.context.concat(res.locals.channel.context);
    } else if (privatePattern.test(res.locals.relativeUrl)) {
        // Branch #11
        coverage[11] = true;
        res.locals.context.push('private');
    } else if (subscribePattern.test(res.locals.relativeUrl) && labs.isSet('subscribers') === true) {
        // Branch #12 and #13
        coverage[12] = true;
        res.locals.context.push('subscribe');
    } else if (data && data.post && data.post.page) {
        // Branch #14, #15 and #16
        coverage[14] = true;
        res.locals.context.push('page');
    } else if (data && data.post) {
        // Branch #17 and #18
        coverage[17] = true;
        res.locals.context.push('post');
    }
}

module.exports = setResponseContext;
