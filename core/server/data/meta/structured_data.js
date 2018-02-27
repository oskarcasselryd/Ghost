var social = require('../../lib/social');

function getStructuredData(metaData, coverageObject = {}) {
    var structuredData,
        card = 'summary';

    if (metaData.coverImage.url) {
        coverageObject[0] = true;
        card = 'summary_large_image';
    }

    structuredData = {
        'og:site_name': metaData.blog.title,
        'og:type': metaData.ogType,
        // CASE: metaData.excerpt for post context is populated by either the custom excerpt,
        // the meta description, or the automated excerpt of 50 words. It is empty for any
        // other context and *always* uses the provided meta description fields.
        'og:url': metaData.canonicalUrl,
        'article:published_time': metaData.publishedDate,
        'article:modified_time': metaData.modifiedDate,
        'article:tag': metaData.keywords,
        'twitter:card': card,
        'twitter:url': metaData.canonicalUrl,
        'twitter:data1': metaData.authorName
    };

    if (metaData.ogTitle) {
        coverageObject[1] = true;
        structuredData['og:title'] = metaData.ogTitle;
    } else {
        coverageObject[2] = true;
        structuredData['og:title'] = metaData.metaTitle;
    }

    if (metaData.ogDescription) {
        coverageObject[3] = true;
        structuredData['og:description'] = metaData.ogDescription;
    } else if (metaData.excerpt) {
        coverageObject[4] = true;
        structuredData['og:description'] = metaData.excerpt;
    } else {
        coverageObject[5] = true;
        structuredData['og:description'] = metaData.metaDescription;
    }

    if (metaData.ogImage.url) {
        coverageObject[6] = true;
        structuredData['og:image'] = metaData.ogImage.url;
    } else {
        coverageObject[7] = true;
        structuredData['og:image'] = metaData.coverImage.url;
    }

    if (metaData.blog.facebook) {
        coverageObject[8] = true;
        structuredData['article:publisher'] = social.urls.facebook(metaData.blog.facebook);
    } else {
        coverageObject[9] = true;
        structuredData['article:publisher'] = undefined;
    }

    if (metaData.authorFacebook) {
        coverageObject[10] = true;
        structuredData['article:author'] = social.urls.facebook(metaData.authorFacebook);
    } else {
        coverageObject[11] = true;
        structuredData['article:author'] = undefined;
    }

    if (metaData.twitterTitle) {
        coverageObject[12] = true;
        structuredData['twitter:title'] = metaData.twitterTitle;
    } else {
        coverageObject[13] = true;
        structuredData['twitter:title'] = metaData.metaTitle;
    }

    if (metaData.twitterDescription) {
        coverageObject[14] = true;
        structuredData['twitter:description'] = metaData.twitterDescription;
    } else if (metaData.excerpt) {
        coverageObject[15] = true;
        structuredData['twitter:description'] = metaData.excerpt;
    } else {
        coverageObject[16] = true;
        structuredData['twitter:description'] = metaData.metaDescription;
    }

    if (metaData.twitterImage) {
        coverageObject[17] = true;
        structuredData['twitter:image'] = metaData.twitterImage;
    } else {
        coverageObject[18] = true;
        structuredData['twitter:image'] = metaData.coverImage.url;
    }

    if (metaData.authorName) {
        coverageObject[19] = true;
        structuredData['twitter:label1'] = 'Written by';
    } else {
        coverageObject[20] = true;
        structuredData['twitter:label1'] = undefined;
    }

    if (metaData.keywords) {
        coverageObject[21] = true;
        structuredData['twitter:label2'] = 'Filed under';
    } else {
        coverageObject[22] = true;
        structuredData['twitter:label2'] = undefined;
    }

    if (metaData.keywords) {
        coverageObject[23] = true;
        structuredData['twitter:data2'] = metaData.keywords.join(', ');
    } else {
        coverageObject[24] = true;
        structuredData['twitter:data2'] = undefined;
    }

    if (metaData.blog.twitter) {
        coverageObject[25] = true;
        structuredData['twitter:site'] = metaData.blog.twitter;
    } else {
        coverageObject[26] = true;
        structuredData['twitter:site'] = undefined;
    }

    if (metaData.creatorTwitter) {
        coverageObject[27] = true;
        structuredData['twitter:creator'] = metaData.creatorTwitter;
    } else {
        coverageObject[28] = true;
        structuredData['twitter:creator'] = undefined;
    }

    if (metaData.ogImage.dimensions) {
        coverageObject[29] = true;
        structuredData['og:image:width'] = metaData.ogImage.dimensions.width;
        structuredData['og:image:height'] = metaData.ogImage.dimensions.height;
    } else if (metaData.coverImage.dimensions) {
        coverageObject[30] = true;
        structuredData['og:image:width'] = metaData.coverImage.dimensions.width;
        structuredData['og:image:height'] = metaData.coverImage.dimensions.height;
    }

    // return structured data removing null or undefined keys
    return Object.keys(structuredData).reduce(function (data, key) {
        var content = structuredData[key];
        if (content !== null && typeof content !== 'undefined') {
            data[key] = content;
        }
        return data;
    }, {});
}

module.exports = getStructuredData;
