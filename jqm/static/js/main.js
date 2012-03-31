/* Globals */
GLOBAL_RSS = {
  'GUELPH_EVENTS_RSS': "http://www.uoguelph.ca/studentaffairs/reg/rssfeed.cfm",
  'GUELPH_MAIN_NEWS_RSS': "http://feeds.feedburner.com/uoguelph",
};
GLOBAL_PAGES = {};
GLOBAL_PAGES[GLOBAL_RSS.GUELPH_EVENTS_RSS] = 'event.html';
GLOBAL_PAGES[GLOBAL_RSS.GUELPH_MAIN_NEWS_RSS] = 'news.html';

/* Rss Functions */
function parseRss(url, callback, options) {
  $.ajax({
    url: document.location.protocol +
    '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&num=-1&q=' +
    encodeURIComponent(url),
    dataType: 'json',
    success: function(data) {
      callback(data.responseData.feed, options);
    }
  });
}

function setItems(feed, options) {
  var header = $(options.id);
  header.text(feed.title);
  if (options.num_items != -1) {
    $('<li><a href="listing.html?url=' + encodeURIComponent(feed.feedUrl) + '" class="get_more">More' +
        '<span class="ui-li-count">' + feed.entries.length + '</span></li>').insertAfter(header);
  }
  $.each($(feed.entries.slice(0, options.num_items)).get().reverse(), function(index, value) {
    $('<li><a href="' + options.page + '?url=' + encodeURIComponent(value.link) + '">' +
      '<h2>' + value.title + '</h2>' +
      '<p>' + value.contentSnippet + '</p>' +
      '</a></li>').insertAfter(header);
  });
  header.parent().listview('refresh');
}

/* Local Storage Functions */
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function saveOptions() {
  if (!supports_html5_storage()) {
    return;
  }
  localStorage.setItem('cla_username', $('#options_central_login_username').val());
  localStorage.setItem('cla_password', $('#options_central_login_password').val());
}

function getOptions() {
  return {
    username: localStorage.getItem('cla_username'),
    password: localStorage.getItem('cla_password')
  };
}

$('#options_save').live('click', function() {
  // store in local storage
  saveOptions();
});

/* Item Content Functions */
function getPage(url, callback) {
  $.get(url, function(data) {
    callback(data);
  });
}

function setEvent(data) {
  var page = $(data.responseText);
  var info = $(page.find('div#stage'));

  var title = $.trim($(page.find('p.text12 strong font')[0]).text());
  var org = $.trim($(page.find('span.text11 font')[0]).text());
  var description = $.trim($(page.find('p.text11')[0]).text());

  $('<h1>' + title + '</h1>').insertBefore($('#item-content'));
  $('<h2>' + org + '</h2>').insertBefore($('#item-content'));
  $('<p>' + description + '</p>').insertBefore($('#item-content'));

  // Build our "clean" table as we filter through the "dirty" table
  var rows = info.find('table tbody tr td table:first tr');
  rows.each(function(index) {
    $('#item-content > tbody:last').append(
      '<tr><td>' +
        $.trim($('td:nth-child(1) font', this).text().replace(/\s{2,}/g, ' ')) +
      '</td><td>' +
        $.trim($('td:nth-child(2) p', this).text().replace(/\s{2,}/g, ' ')) +
      '</td></tr>');
  });
  // TODO(nickp): Logic in here to show register/deregister button
  $('#register').show();
}

function setNews(data) {
  var page = $(data.responseText);
  var content = $('div#content', page);
  $('img', content).remove();
  $('#item-content').append(content);
}

/* Bind to the pages */
function get_url(e) {
  // Was redirected to page from jQM, get data-url
  var item_url = decodeURIComponent($(e.target).attr('data-url').replace(/.*url=/, ''));
  if (item_url.slice(0, 4).toLowerCase() != 'http') {
    // Directly went to the URL (bookmark, refresh, etc)
    item_url = decodeURIComponent($.mobile.path.parseUrl(window.location).search.substring(5));
  }
  return item_url;
}


$('#page_connect').live('pageinit', function() {
  parseRss(GLOBAL_RSS.GUELPH_EVENTS_RSS, setItems,
    {id: '#events_header', page: GLOBAL_PAGES[GLOBAL_RSS.GUELPH_EVENTS_RSS], num_items: 5});
  parseRss(GLOBAL_RSS.GUELPH_MAIN_NEWS_RSS, setItems,
    {id: '#news_main_header', page: GLOBAL_PAGES[GLOBAL_RSS.GUELPH_MAIN_NEWS_RSS], num_items: 5});
});

$('#page_options').live('pageinit', function() {
  details = getOptions();
  $('#options_central_login_username').val(details.username);
  $('#options_central_login_password').val(details.password);
});

$('#page_event_item').live('pageinit', function(e) {
  var item_url = get_url(e);
  getPage(item_url, setEvent);
});

$('#page_news_item').live('pageinit', function(e) {
  var item_url = get_url(e);
  getPage(item_url, setNews);
});

$('#page_listing').live('pageinit', function(e) {
  var item_url = get_url(e);
  parseRss(item_url, setItems,
    {id: '#item_listing_header', page: GLOBAL_PAGES[item_url], num_items: -1});
});
