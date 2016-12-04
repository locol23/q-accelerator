import assert from 'power-assert';
import sinon from 'sinon';
import Util from '../../src/js/util';
import ChromeStorage from '../../src/js/chrome-storage';


describe('util.parseUrl()', function() {

  it('userIdとitemIdが取れること', function() {
    const URL = 'http://qiita.com/howdy39/items/35729490b024ca295d6c';
    const {userId, itemId} = Util.parseUrl(URL);
    assert(userId === 'howdy39');
    assert(itemId === '35729490b024ca295d6c');
  });

  it('userIdとitemIdが取れること（https）', function() {
    const URL = 'https://qiita.com/howdy39/items/35729490b024ca295d6c';
    const {userId, itemId} = Util.parseUrl(URL);
    assert(userId === 'howdy39');
    assert(itemId === '35729490b024ca295d6c');
  });

  it('userIdとitemIdが取れること（相対パス）', function() {
    const URL = '/howdy39/items/35729490b024ca295d6c';
    const {userId, itemId} = Util.parseUrl(URL);
    assert(userId === 'howdy39');
    assert(itemId === '35729490b024ca295d6c');
  });


  it('userIdとitemIdが取れること（末尾スラッシュあり）', function() {
    const URL = 'https://qiita.com/howdy39/items/35729490b024ca295d6c/';
    const {userId, itemId} = Util.parseUrl(URL);
    assert(userId === 'howdy39');
    assert(itemId === '35729490b024ca295d6c');
  });

  it('userIdとitemIdが取れること（GETパラメータあり）', function() {
    const URL = 'https://qiita.com/howdy39/items/35729490b024ca295d6c?utm_campaign=popular_items&utm_medium=referral&utm_source=popular_items';
    const {userId, itemId} = Util.parseUrl(URL);
    assert(userId === 'howdy39');
    assert(itemId === '35729490b024ca295d6c');
  });

  it('userIdとitemIdが取れること（末尾スラッシュ/GETパラメータあり）', function() {
    const URL = 'https://qiita.com/howdy39/items/35729490b024ca295d6c/?utm_campaign=popular_items&utm_medium=referral&utm_source=popular_items';
    const {userId, itemId} = Util.parseUrl(URL);
    assert(userId === 'howdy39');
    assert(itemId === '35729490b024ca295d6c');
  });

  it('userIdとitemIdが取れること（ハッシュフラグメントあり）', function() {
    const URL = 'http://qiita.com/howdy39/items/35729490b024ca295d6c#%E3%81%93%E3%81%93%E3%81%BE%E3%81%A7%E3%81%AE%E5%9B%B3%E8%A7%A3';
    const {userId, itemId} = Util.parseUrl(URL);
    assert(userId === 'howdy39');
    assert(itemId === '35729490b024ca295d6c');
  });

});


describe('util.createHistoryEntity()', function() {

  it('返り値が{userId.itemId: {userId, itemId, title, date}の形式であること', function() {
    const URL = 'http://qiita.com/howdy39/items/35729490b024ca295d6c';
    const TITLE = '図で理解するJavaScriptのプロトタイプチェーン';
    const DATE = '1479563977777';

    const entity = Util.createHistoryEntity(URL, TITLE, DATE);
    const expectedEntity = {
      'howdy39.35729490b024ca295d6c': {
        'userId': 'howdy39',
        'itemId': '35729490b024ca295d6c',
        'title': TITLE,
        'date': DATE
      }
    };

    assert(JSON.stringify(entity) === JSON.stringify(expectedEntity));
  });

});


describe('util.saveHistory()', function() {
  let savedHitories;

  const URL = 'http://qiita.com/howdy39/items/35729490b024ca295d6c';
  const TITLE = '図で理解するJavaScriptのプロトタイプチェーン';
  const DATE = '1479563977777';

  beforeEach(function () {
    this.getHistoriesStub = sinon.stub(
      ChromeStorage,
      'getHistories',
      (callback) => {
        callback(savedHitories);
      }
    );

    this.saveHistoriesStub = sinon.stub(
      ChromeStorage,
      'saveHistories',
      (history, callback) => {
        callback();
      }
    );
  });

  afterEach(function () {
    ChromeStorage.getHistories.restore();
    ChromeStorage.saveHistories.restore();
  });


  describe('履歴がない場合', function() {

    beforeEach(function () {
      savedHitories = {};
    });

    it('履歴が登録できること', function() {
      const expectedHistory =
        {
          'howdy39.35729490b024ca295d6c': {
            'userId': 'howdy39',
            'itemId': '35729490b024ca295d6c',
            'title': TITLE,
            'date': DATE
          }
        };

      Util.saveHistory(URL, TITLE, DATE);
      assert(JSON.stringify(this.saveHistoriesStub.firstCall.args[0]) === JSON.stringify(expectedHistory));
    });

  });


  describe('履歴がある場合', function() {

    beforeEach(function () {
      savedHitories = {
        'howdy39.3b2b14ce73ec44c54f7b': {
          'userId': 'howdy39',
          'itemId': '3b2b14ce73ec44c54f7b',
          'title': 'GoogleのWebAPI設計とWebAPI設計のベストプラクティスを比較してみる',
          'date': '1479563912537'
        }
      };
    });

    it('履歴が追加できること', function() {
      const expectedHistory = Object.assign({},
        savedHitories,
        {
          'howdy39.35729490b024ca295d6c': {
            'userId': 'howdy39',
            'itemId': '35729490b024ca295d6c',
            'title': TITLE,
            'date': DATE
          }
        }
      );

      Util.saveHistory(URL, TITLE, DATE);
      assert(JSON.stringify(this.saveHistoriesStub.firstCall.args[0]) === JSON.stringify(expectedHistory));
    });

    it('同じ主キー(userId, itemId)の履歴がある場合にtitle, dateが更新されること', function() {
      const HISTORY_URL = 'http://qiita.com/howdy39/items/3b2b14ce73ec44c54f7b';
      const NEW_TITLE = 'GoogleのWebAPI設計とWebAPI設計のベストプラクティスを比較してみる----変更';
      const NEW_DATE = '1479563999999';
      const expectedHistory = {
        'howdy39.3b2b14ce73ec44c54f7b': {
          'userId': 'howdy39',
          'itemId': '3b2b14ce73ec44c54f7b',
          'title': NEW_TITLE,
          'date': NEW_DATE
        }
      };

      Util.saveHistory(HISTORY_URL, NEW_TITLE, NEW_DATE);

      assert(JSON.stringify(this.saveHistoriesStub.firstCall.args[0]) === JSON.stringify(expectedHistory));
    });

  });

});