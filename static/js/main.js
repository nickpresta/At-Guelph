/* Rss Functions */
function parseRss(url, callback, id, page) {
  $.ajax({
    url: document.location.protocol +
    '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&num=-1&q=' +
    encodeURIComponent(url),
    dataType: 'json',
    success: function(data) {
      callback(data.responseData.feed, id, page);
    }
  });
}

function setItems(feed, id, page) {
  var header = $(id);
  header.text(feed.title);
  $('<li><a href="' + feed.feedUrl + '" class="get_more">More' +
      '<span class="ui-li-count">' + feed.entries.length + '</span></li>').insertAfter(header);
  $.each($(feed.entries.slice(0, 5)).get().reverse(), function(index, value) {
    $('<li><a href="' + page + '?url=' + encodeURIComponent(value.link) + '">' +
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
    return false;
  }
  localStorage.setItem('cla_username', $('#options_central_login_username').val());
  localStorage.setItem('cla_password', $('#options_central_login_password').val());
  return true;
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
  var rows = page.find('table tbody tr td table tr');
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
  $('#item-content').append($('div#content', page));
}

/* Bind to the pages */
$('#page_connect').live('pageinit', function() {
  console.log("#page_connect's pageinit is firing!");
  parseRss('http://www.uoguelph.ca/studentaffairs/reg/rssfeed.cfm', setItems, '#events_header', 'event.html');
  parseRss('http://feeds.feedburner.com/uoguelph', setItems, '#news_main_header', 'news.html');
  //parseRss('http://atguelph.uoguelph.ca/feed/', setItems, '#news_atguelph_header', 'news.html');
});

$('#page_options').live('pageinit', function() {
  details = getOptions();
  $('#options_central_login_username').val(details.username);
  $('#options_central_login_password').val(details.password);
});

$('#event_item').live('pageinit', function(e) {
  var item_url = decodeURIComponent($.mobile.path.parseUrl(window.location).search.substring(5)) ||
    decodeURIComponent($(e.target).attr('data-url').replace(/.*url=/, ''));
  getPage(item_url, setEvent);
});

$('#news_item').live('pageinit', function(e) {
  var item_url = decodeURIComponent($.mobile.path.parseUrl(window.location).search.substring(5)) ||
    decodeURIComponent($(e.target).attr('data-url').replace(/.*url=/, ''));
  getPage(item_url, setNews);
});
