var should = require('should'), // jshint ignore:line
    sinon = require('sinon'),
    getTitle = require('../../../../server/data/meta/title'),
    settingsCache = require('../../../../server/services/settings/cache'),
    sandbox = sinon.sandbox.create();

describe('getTitle', function () {
    var localSettingsCache = {};

    var coverage = [];
    coverage.length=32;
    coverage = coverage.fill(false);

    beforeEach(function () {
        sandbox.stub(settingsCache, 'get').callsFake(function (key) {
            return localSettingsCache[key];
        });
    });

    afterEach(function () {
        sandbox.restore();
        localSettingsCache = {};
    });

    it('should return meta_title if on data root', function () {
        var ret = getTitle({
            meta_title: 'My test title'
        },null,null,coverage);
        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My test title');
    });

    it('should return blog title if on home', function () {
        localSettingsCache.title = 'My blog title';

        var ret = getTitle({}, {context: 'home'},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My blog title');
    });

    it('should return author name - blog title if on data author page', function () {
        localSettingsCache.title = 'My blog title 2';

        var ret = getTitle({
            author: {
                name: 'Author Name'
            }
        }, {context: ['author']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('Author Name - My blog title 2');
    });

    it('should return author page title if on data author page with more then one page', function () {
        localSettingsCache.title = 'My blog title 2';

        var ret = getTitle({
            author: {
                name: 'Author Name'
            }
        }, {
            context: ['author', 'paged'],
            pagination: {
                total: 40,
                page: 3
            }
        },null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('Author Name - My blog title 2 (Page 3)');
    });

    it('should return tag name - blog title if on data tag page no meta_title', function () {
        localSettingsCache.title = 'My blog title 3';

        var ret = getTitle({
            tag: {
                name: 'Tag Name'
            }
        }, {context: ['tag']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('Tag Name - My blog title 3');
    });

    it('should return tag name - blog title if on data tag page no meta_title (Page #)', function () {
        localSettingsCache.title = 'My blog title 3';

        var ret = getTitle({
            tag: {
                name: 'Tag Name'
            }
        }, {
            context: ['tag', 'paged'],
            pagination: {
                total: 40,
                page: 39
            }
        },null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('Tag Name - My blog title 3 (Page 39)');
    });

    it('should return tag meta_title if in tag data', function () {
        var ret = getTitle({
            tag: {
                name: 'Tag Name',
                meta_title: 'My Tag Meta Title!'
            }
        }, {context: ['tag']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My Tag Meta Title!');
    });

    it('should return post title if in post context', function () {
        var ret = getTitle({
            post: {
                title: 'My awesome post!'
            }
        }, {context: ['post']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My awesome post!');
    });

    it('should return OG post title if in post context', function () {
        var ret = getTitle({
            post: {
                title: 'My awesome post!',
                og_title: 'My Custom Facebook Title'
            }
        }, {
            context: ['post']
        }, {
            property: 'og'
        },coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My Custom Facebook Title');
    });

    it('should return twitter post title if in post context', function () {
        var ret = getTitle({
            post: {
                title: 'My awesome post!',
                twitter_title: 'My Custom Twitter Title'
            }
        }, {
            context: ['post']
        }, {
            property: 'twitter'
        },coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My Custom Twitter Title');
    });

    it('should not return default post title if in amp context and called with twitter property', function () {
        var ret = getTitle({
            post: {
                title: 'My awesome post!',
                twitter_title: ''
            }
        }, {
            context: ['amp', 'post']
        }, {
            property: 'twitter'
        },coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('');
    });

    it('should return post title if in amp context', function () {
        var ret = getTitle({
            post: {
                title: 'My awesome post!'
            }
        }, {context: ['amp', 'post']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My awesome post!');
    });

    it('should return post title if in page context', function () {
        var ret = getTitle({
            post: {
                title: 'My awesome page!'
            }
        }, {context: ['page']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My awesome page!');
    });

    it('should return post title if in amp and page context', function () {
        var ret = getTitle({
            post: {
                title: 'My awesome page!'
            }
        }, {context: ['amp', 'page']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My awesome page!');
    });

    it('should return post meta_title if in post data', function () {
        var ret = getTitle({
            post: {
                name: 'My awesome post!',
                meta_title: 'My Tag Meta Title Post!  '
            }
        }, {context: ['post']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My Tag Meta Title Post!');
    });

    it('should return post meta_title if amp context in post data', function () {
        var ret = getTitle({
            post: {
                name: 'My awesome post!',
                meta_title: 'My Tag Meta Title Post!  '
            }
        }, {context: ['amp', 'post']},null,coverage);

        var title = ret[0];
        coverage = ret[1];
        title.should.equal('My Tag Meta Title Post!');
    });

    it('should return blog title with page if unknown type', function () {
        localSettingsCache.title = 'My blog title 4';

        var ret = getTitle({}, {
            context: ['paged'],
            pagination: {
                total: 40,
                page: 35
            }
        },null,coverage);

        var title = ret[0];
        coverage = ret[1];
                console.log(coverage);
        title.should.equal('My blog title 4 (Page 35)');
    });

});
