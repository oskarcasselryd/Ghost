// # Body Class Helper
// Usage: `{{body_class}}`
//
// Output classes for the body element
var proxy = require("./proxy"),
    _ = require("lodash"),
    SafeString = proxy.SafeString;

// We use the name body_class to match the helper for consistency:
module.exports = function body_class(options, coverageObject = {}) {
    // eslint-disable-line camelcase
    var classes = [],
        context = options.data.root.context,
        post = this.post,
        tags,
        page;

    if (this.post) {
        coverageObject[0] = true;
        if (this.post.tags) {
            coverageObject[1] = true;
            tags = this.post.tags;
        } else if (this.tags) {
            coverageObject[2] = true;
            tags = this.tags;
        } else {
            coverageObject[3] = true;
            tags = [];
        }
    }

    if (this.post) {
        coverageObject[4] = true;
        if (this.post.page) {
            coverageObject[5] = true;
            page = this.post.page;
        } else if (this.page) {
            coverageObject[6] = true;
            page = this.page;
        } else {
            coverageObject[7] = true;
            page = false;
        }
    }

    if (_.includes(context, "home")) {
        coverageObject[8] = true;
        classes.push("home-template");
    } else if (_.includes(context, "post")) {
        coverageObject[9] = true;
        if (post) {
            coverageObject[10] = true;
            classes.push("post-template");
        }
    } else if (_.includes(context, "page")) {
        coverageObject[11] = true;
        if (page) {
            coverageObject[12] = true;
            classes.push("page-template");
            classes.push("page-" + this.post.slug);
        }
    } else if (_.includes(context, "tag")) {
        coverageObject[13] = true;
        if (this.tag) {
            coverageObject[14] = true;
            classes.push("tag-template");
            classes.push("tag-" + this.tag.slug);
        }
    } else if (_.includes(context, "author")) {
        coverageObject[15] = true;
        if (this.author) {
            coverageObject[16] = true;
            classes.push("author-template");
            classes.push("author-" + this.author.slug);
        }
    } else if (_.includes(context, "private")) {
        coverageObject[17] = true;
        classes.push("private-template");
    }

    if (tags) {
        coverageObject[18] = true;
        classes = classes.concat(
            tags.map(function(tag) {
                return "tag-" + tag.slug;
            })
        );
    }

    if (_.includes(context, "paged")) {
        coverageObject[19] = true;
        classes.push("paged");
    }

    classes = _.reduce(
        classes,
        function(memo, item) {
            return memo + " " + item;
        },
        ""
    );
    return new SafeString(classes.trim());
};
