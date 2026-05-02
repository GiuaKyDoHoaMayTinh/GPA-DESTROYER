/**
 * Gửi điểm lên API (cùng origin khi chạy server). Cần Bearer JWT (đăng nhập hoặc phiên khách).
 */
(function () {
  var TOKEN_KEY = 'gpa_access_token';

  function canFetchApi() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  }

  function apiRoot() {
    return typeof window.GPA_API_BASE === 'string' ? window.GPA_API_BASE : '';
  }

  function postScore(gameId, score, meta) {
    if (!canFetchApi()) return Promise.resolve({ skipped: true, reason: 'offline' });
    var token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return Promise.resolve({ skipped: true, reason: 'no_token' });
    var url = apiRoot() + '/api/scores';
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({
        gameId: gameId,
        score: Math.floor(Number(score)) || 0,
        meta: meta != null ? meta : null,
      }),
    }).then(function (res) {
      if (!res.ok) return res.json().then(function (j) { throw new Error(j.error || res.status); });
      return res.json();
    });
  }

  window.GPA_SCORE = {
    postScore: postScore,
    canFetchApi: canFetchApi,
  };
})();
