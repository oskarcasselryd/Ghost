var _ = require('lodash'),
settingsCache = require('../../services/settings/cache');

function getTitle(data, root, options, coverage) {
  var title = '',
  postSdTitle,
  blogTitle = settingsCache.get('title'),
  pageString = '';
  var context = null;
  if (root) {//branch #1
    //console.log("b01");
    coverage[0]=true;
    context = root.context;
  }
  var pagination = null;
  if (root) {//branch #2
    //console.log("b02");
    coverage[1]=true;
    pagination = root.pagination;
  }

  if (options) {//branch #3
    //console.log("b03");
    coverage[2]=true;
    options = options;
  } else {
    //console.log("b04");
    coverage[3]=true;
    options = {};
  }

  if (pagination) {//branch #4
    //console.log("b05");
    coverage[4]=true;
    if(pagination.total > 1){//branch #5
      //console.log("b06");
      coverage[5]=true;
      pageString = ' (Page ' + pagination.page + ')';
    }
  }

  // If there's a specific meta title
  if (data.meta_title) {//branch #6
    //console.log("b07");
    coverage[6]=true;
    title = data.meta_title;

    return branch30(title, coverage);
  }
  // Home title
  if (_.includes(context, 'home')) {//branch #7
    //console.log("b08");
    coverage[7]=true;
    title = blogTitle;

    return branch30(title, coverage);
  }
  // Author title, paged
  if (_.includes(context, 'author')) {//branch #8
    //console.log("b09");
    coverage[8]=true;
    if(data.author){//branch #9
      //console.log("b10");
      coverage[9]=true;
      if(_.includes(context, 'paged')){//branch #10
        //console.log("b11");
        coverage[10]=true;
        title = data.author.name + ' - ' + blogTitle + pageString;

        return branch30(title, coverage);
      }
    }
  }
  // Author title, index
  if (_.includes(context, 'author')) {//branch #11
    //console.log("b12");
    coverage[11]=true;
    if(data.author){//branch #12
      //console.log("b13");
      coverage[12]=true;
      title = data.author.name + ' - ' + blogTitle;

      return branch30(title, coverage);
    }
  }
  // Tag title, paged
  if (_.includes(context, 'tag')) {//branch #13
    //console.log("b14");
    coverage[13]=true;
    if(data.tag){//branch #14
      //console.log("b15");
      coverage[14]=true;
      if(_.includes(context, 'paged')){//branch #15
        //console.log("b16");
        coverage[15]=true;
        if(data.tag.meta_title){//branch #16
          //console.log("b17");
          coverage[16]=true;
          title = data.tag.meta_title;
        } else {
          //console.log("b18");
          coverage[17]=true;
          title = data.tag.name + ' - ' + blogTitle + pageString;
        }
        return branch30(title, coverage);
      }
    }
  }
  // Tag title, index
  if (_.includes(context, 'tag') && data.tag) {//branch #17
    //console.log("b19");
    coverage[18]=true;
    if(data.tag){//branch #18
      //console.log("b20");
      coverage[19]=true;
      if(data.tag.meta_title){//branch #19
        //console.log("b21");
        coverage[20]=true;
        title = data.tag.meta_title;
      } else {
        //console.log("b22");
        coverage[21]=true;
        title = data.tag.name + ' - ' + blogTitle;
      }
      return branch30(title, coverage);
    }
  }
  // Post title
  if (_.includes(context, 'post') ) {//branch #20
    //console.log("b23");
    coverage[22]=true;
    if(data.post){//branch #22
      //console.log("b25");
      coverage[24]=true;
      return branch25(data, root, options, coverage);
    }
  } else if (_.includes(context, 'page')) {//branch #21
    //console.log("b24");
    coverage[23]=true;
    if(data.post){//branch #22
      //console.log("b25");
      coverage[24]=true;
      return branch25(data, root, options, coverage);
    }
  }

  // Fallback
  //console.log("b32");
  coverage[31]=true;
  title = blogTitle + pageString;

  return branch30(title, coverage);

}

module.exports = getTitle;

function branch30(title, coverage){
  if(title){ //branch #27
    //console.log("b30");
    coverage[29]=true;
    return [title.trim(),coverage];
  } else {
    //console.log("b31");
    coverage[30]=true;
    return [''.trim(),coverage];
  }
}

function branch25(data, root, options, coverage){
  if (options) {//branch #23
    //console.log("b26");
    coverage[25]=true;
    if(options.property){ //branch #24
      //console.log("b27");
      coverage[26]=true;
      postSdTitle = options.property + '_title';

      title = '';
      if (data.post[postSdTitle]) { //branch #25
        //console.log("b28");
        coverage[27]=true;
        title = data.post[postSdTitle];
      }
      return branch30(title, coverage);
    }
  }

  title = data.post.title;
  if (data.post.meta_title) {//branch #26
    //console.log("b29");
    coverage[28]=true;
    title = data.post.meta_title;
  }

  return branch30(title, coverage);
}
