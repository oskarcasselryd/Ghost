var should = require('should'), // jshint ignore:line
    sinon = require('sinon'),
    getMetaDescription = require('../../../../server/data/meta/description'),
    settingsCache = require('../../../../server/services/settings/cache'),
    sandbox = sinon.sandbox.create();

describe('getMetaDescription', function () {
    var coverage;
    let blogDescription = 'My blog description';

    before(function() {
        coverage = new Array(20); // 21 branches
        for(let i=0; i<20; i++) {
            coverage[i] = false;
        }

        sandbox.stub(settingsCache, 'get').callsFake(function (key) {
            if (key === 'description') {
                return blogDescription;
            }
            return '';
        });
    });

    after(function() {
        var allCovered = true;
        for(let i=0; i<20; i++) {
            if (coverage[i] == false) {
                allCovered = false;
                console.log("Did not reach branch #" + i);
            }
        }
        if(allCovered) {
            console.log("All branches covered!");
        }

        sandbox.restore()
    });
        //


    it('should return meta_description if on data root', function () {
        var description = getMetaDescription({
            meta_description: 'My test description.'
        }, undefined, undefined, coverage);
        description.should.equal('My test description.');
    });

    it('should return empty string if on root context contains paged', function () {
        var description = getMetaDescription({}, {
            context: ['paged']
        }, undefined, coverage);
        description.should.equal('');
    });

    it('should return blog description if on root context contains home', function () {
        var description = getMetaDescription({}, {
            context: ['home']
        }, undefined, coverage);

        description.should.equal(blogDescription);
    });

    it('should not return meta description for author if on root context contains author and no meta description provided', function () {
        var description = getMetaDescription({
            author: {
                bio: 'Just some hack building code to make the world better.'
            }
        }, {
            context: ['author']
        }, undefined, coverage);
        description.should.equal('');
    });

    it('should not return meta description for author if on root context contains author and no meta description provided', function () {
        var description = getMetaDescription({}, {
            context: ['author']
        }, undefined, coverage);
        description.should.equal('');
    });

    it('should return meta description for author if on root context contains author and meta description provided', function () {
        var description = getMetaDescription({
            author: {
                bio: 'Just some hack building code to make the world better.',
                meta_description: 'Author meta description.'
            }
        }, {
            context: ['author']
        }, undefined, coverage);
        description.should.equal('Author meta description.');
    });

    it('should return data tag meta description if on root context contains tag', function () {
        var description = getMetaDescription({
            tag: {
                meta_description: 'Best tag ever!'
            }
        }, {
            context: ['tag']
        }, undefined, coverage);
        description.should.equal('Best tag ever!');
    });

    it('should not return data tag description if no meta description for tag', function () {
        var description = getMetaDescription({
            tag: {
                meta_description: '',
                description: 'The normal description'
            }
        }, {
            context: ['tag']
        }, undefined, coverage);
        description.should.equal('');
    });

    it('should not return data tag description if no meta description for tag', function () {
        var description = getMetaDescription({}, {
            context: ['tag']
        }, undefined, coverage);
        description.should.equal('');
    });

    it('should return data post meta description if on root context contains post', function () {
        var description = getMetaDescription({
            post: {
                meta_description: 'Best post ever!'
            }
        }, {
            context: ['post']
        }, undefined, coverage);
        description.should.equal('Best post ever!');
    });

    it('should return OG data post meta description if on root context contains post', function () {
        var description = getMetaDescription({
            post: {
                meta_description: 'Best post ever!',
                og_description: 'My custom Facebook description!'
            }
        }, {
            context: ['post']
        }, {
            property: 'og'
        }, coverage);
        description.should.equal('My custom Facebook description!');
    });

    it('should not return data post meta description if on root context contains post and called with OG property', function () {
        var description = getMetaDescription({
            post: {
                meta_description: 'Best post ever!',
                og_description: ''
            }
        }, {
            context: ['post']
        }, {
            property: 'og'
        }, coverage);
        description.should.equal('');
    });

    it('should return Twitter data post meta description if on root context contains post', function () {
        var description = getMetaDescription({
            post: {
                meta_description: 'Best post ever!',
                twitter_description: 'My custom Twitter description!'
            }
        }, {
            context: ['post']
        }, {
            property: 'twitter'
        }, coverage);
        description.should.equal('My custom Twitter description!');
    });

    it('should return data post meta description if on root context contains post for an AMP post', function () {
        var description = getMetaDescription({
            post: {
                meta_description: 'Best AMP post ever!'
            }
        }, {
            context: ['amp', 'post']
        }, undefined, coverage);
        description.should.equal('Best AMP post ever!');
    });

    it('should return data post meta description if on root context contains page', function () {
        var description = getMetaDescription({
            post: {
                meta_description: 'Best page ever!'
            }
        }, {
            context: ['page']
        }, undefined, coverage);
        description.should.equal('Best page ever!');
    });

    it('should not return data post meta description if on root context contains page', function () {
        var description = getMetaDescription({}, {
            context: ['page']
        }, undefined, coverage);
        description.should.equal('');
    });
});
