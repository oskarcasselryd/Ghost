var _ = require('lodash'),
    settingsCache = require('../../services/settings/cache');


function getTitleForTag(context, data, blogTitle, pageString) {
    // Tag title, paged
    if(_.includes(context, 'paged')) {
        return data.tag.meta_title || data.tag.name + ' - ' + blogTitle + pageString;
    // Tag title, index
    } else {
        return data.tag.meta_title || data.tag.name + ' - ' + blogTitle;
    }
}

function getTitleForAuthor(context, data, blogTitle, pageString) {
    // Author title, paged
    if(_.includes(context, 'paged')) {
        return data.author.name + ' - ' + blogTitle + pageString;
    // Author title, index
    } else {
        return data.author.name + ' - ' + blogTitle;
    }
}

function getContext(root) {
    return root ? root.context : null;
}

function getPagination(root) {
    return root ? root.pagination : null;
}

function getTitle(data, root, options) {
    var title = '',
        context = getContext(root),
        postSdTitle,
        blogTitle = settingsCache.get('title'),
        pagination = getPagination(root),
        pageString = '';

    options = options ? options : {};

    if (pagination && pagination.total > 1) {
        pageString = ' (Page ' + pagination.page + ')';
    }

    // If there's a specific meta title
    if (data.meta_title) {
        title = data.meta_title;
    // Home title
    } else if (_.includes(context, 'home')) {
        title = blogTitle;
    // Author title
    } else if (_.includes(context, 'author') && data.author) {
        title = getTitleForAuthor(context, data, blogTitle, pageString);
    // Tag title
    } else if (_.includes(context, 'tag') && data.tag) {
        title = getTitleForTag(context, data, blogTitle, pageString);
    // Post title
    } else if ((_.includes(context, 'post') || _.includes(context, 'page')) && data.post) {
        if (options && options.property) {
            postSdTitle = options.property + '_title';
            title = data.post[postSdTitle] || '';
        } else {
            title = data.post.meta_title || data.post.title;
        }
    // Fallback
    } else {
        title = blogTitle + pageString;
    }

    return (title || '').trim();
}

module.exports = getTitle;
