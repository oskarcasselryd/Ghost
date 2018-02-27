var _ = require('lodash'),
    settingsCache = require('../../services/settings/cache');

function getDescription(data, root, options, coverage = new Array(20)) {
    var description = '',
        postSdDescription,
        context,
        blogDescription = settingsCache.get('description');

        if (root) {
            // Branch #1
            coverage[1] = true;
            context = root.context;
        } else {
            context = null;
        }

    if (options) {
        // Branch #2
        coverage[2] = true;
        options = options;
    } else {
        options = {};
    }



    // --------- COVERAGE ---------
    if((_.includes(context, 'author') && !data.author)) {
        coverage[7] = true;
    }

    if((_.includes(context, 'tag') && !data.tag)) {
        coverage[10] = true;
    }

    if(_.includes(context, 'post') && !_.includes(context, 'page') && data.post) {
        coverage[12] = true;
    }

    if(!_.includes(context, 'post') && _.includes(context, 'page') && data.post) {
        coverage[13] = true;
    }

    if((_.includes(context, 'post') || _.includes(context, 'page')) && !data.post) {
        coverage[14] = true;
    }

    if (options && !options.property) {
        coverage[16] = true;
    }
    // ----------------------------



    // We only return meta_description if provided. Only exception is the Blog
    // description, which doesn't rely on meta_description.
    if (data.meta_description) {
        // Branch #3
        coverage[3] = true;
        description = data.meta_description;
    } else if (_.includes(context, 'paged')) {
        // Branch #4
        coverage[4] = true;
        description = '';
    } else if (_.includes(context, 'home')) {
        // Branch #5
        coverage[5] = true;
        description = blogDescription;

    } else if (_.includes(context, 'author') && data.author) {
        // Branch # 6 and #7
        coverage[6] = true;

        // The usage of meta data fields for author is currently not implemented.
        // We do have meta_description and meta_title fields
        // in the users table, but there's no UI to populate those.
        if (data.author.meta_description) {
            // Branch #8
            coverage[8] = true;
            description = data.author.meta_description;
        } else {
            description = '';
        }
    } else if (_.includes(context, 'tag') && data.tag) {
        // Branch #9 and #10
        coverage[9] = true;
        if (data.tag.meta_description) {
            // Branch #11
            coverage[11] = true;
            description = data.tag.meta_description;
        } else {
            description = '';
        }
    } else if ((_.includes(context, 'post') || _.includes(context, 'page')) && data.post) {
        // Branch #12, #13 and #14
        if (options && options.property) {
            coverage[15] = true;
            // Branch #15 and #16
            postSdDescription = options.property + '_description';
            if (data.post[postSdDescription]) {
                // Branch #17
                coverage[17] = true;
                description = data.post[postSdDescription];
            } else {
                description = '';
            }
        } else {
            if (data.post.meta_description) {
                // Branch #18
                coverage[18] = true;
                description = data.post.meta_description;
            } else {
                description = '';
            }
        }
    }

    if (description) {
        // Branch #19
        coverage[19] = true;
        return description.trim();
    } else {
        // Branch #0
        coverage[0] = true;
        return ''.trim();
    }
}

module.exports = getDescription;
