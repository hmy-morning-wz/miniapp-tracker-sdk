import { logger } from "./common"
const canIUseRequest = my.canIUse("request")

export function setStorageSync(key, data) {
  my.setStorageSync({ key: key, data: data });
}

export function setStorage(key, data) {
  my.setStorage({ key: key, data: data });
}

export function getStorageSync(key) {
  var o = my.getStorageSync({ key: key });
  console.log(key, o);
  return o.data || o.APDataStorage;
}
export function guid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (e) {
    var t = (16 * Math.random()) | 0,
      r = "x" === e ? t : (3 & t) | 8;
    return r.toString(16);
  });
}

export function setUID(key, uid) {
  try {
    var key = key || "mtr-mdap";
    setStorage(key, uid);
    return uid;
  } catch (b) { }
}
//userId


export function getUUid(callback) {
  var uid;
  var key = "mtr-mdap";
  try {
    my.getStorage({
      key: key,
      success: function (res) {
        uid = res && res.success && res.data;
        uid = uid ? uid : ((uid = guid()), setUID(key, uid));
      },
      complete: function () {
        callback && callback(uid);
      }
    });
  } catch (err) {
    console.error(err)
    callback && callback(uid);
   }
}

export function getSessionId() {
  return guid();
}

function getSystemInfo() {
  let info = {};
  return new Promise((r, _) => {
    try {
      my.getSystemInfo({
        success: function (res: any) {
          info = {
            deviceModel: encodeURIComponent(res.model),
            pixelRatio: res.pixelRatio,
            screen: { width: res.windowWidth, height: res.windowHeight },
            language: res.language,
            appVersion: res.version,
            osVersion: encodeURIComponent(res.system),
            os: encodeURIComponent(res.platform),
            sessionId: getSessionId()
          };
        },
        complete: function () {
          r(info);
        }
      });
    } catch (err) {
      console.error(err)
      r(info);
    }
  })
}
function getNetworkType() {
  return new Promise((r, _) => {
    let info: any = {}
    my.getNetworkType({
      success: function (res: any) {
        try {
          info.networkType = (res && res.networkType)
        } catch (err) {
          console.log(err)
        }
      },
      complete: function () {
        r(info)
      }
    });
  })

}

function getBasicStorage() {
  return new Promise((r, _) => {
    let key = "mtr-mdap-data";
    let info: any = {}
    try {
      my.getStorage({
        key: key,
        success: function (res) {
          if (res && res.data) {
            info = res.data || {}
          }
          //uid = res && res.success && res.data;
          //uid = uid ? uid : ((uid = guid()), setUID(key, uid));
        },
        complete: function () {
          r(info)
        }
      });
    } catch (a) {
      r(info)
    }
  })
}

function saveBasicStorage(info: any) {  
    my.setStorage({
      key:  "mtr-mdap-data",
      data: info
    });
}

export function getBasicInfo(callback:Function) {
  let p = [getBasicStorage(), getSystemInfo(), getNetworkType()]
  return Promise.all(p)
    .then((res: any[]) => {
      //console.log("getBasicInfo",res)
      let info = Object.assign(res[0], res[1], res[2])
      let uid = info.uid
      if (!uid) {
        getUUid((res: string) => {
          info.uid = res || guid()
          saveBasicStorage(info)
          callback(info)
        })
      } else {
        callback(info)
      }
    }
    )
    .catch((err) => {
      console.error(err)
      callback({})
    })
}


export function requestNext(that) {
  if (that && that.requestList && that.requestList.length > 0) {
    var send = that.requestList.shift();
    that.requestTimestamp = Date.now();
    that && that.mtrDebug && logger("request");
    that.sendIng = 1;
    canIUseRequest && my.request(send);
  }
}

export function request(url, msg, that) {
  var send = {
    url: url,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: "data=" + encodeURIComponent(msg),
    method: "POST",
    dataType: "text",
    noTracker: true,
    success: function () {
      that && that.sendSuccess++;
      that && that.mtrDebug && logger("send Success");
    },
    fail: function (res:any) {
      that && that.sendError++;
      that && that.mtrDebug && console.warn("Tracker requestres send fail", res);
      my.reportAnalytics("tracker_send_fail", res);
    },
    complete: function () {
      that.sendIng = 0;
      that && that.mtrDebug && logger("send complete");
      requestNext(that);
    }
  };
  that && that.sendCounter++;
  if (that && that.requestList) {
    that.requestList.push(send);
    if (that.sendIng === 0 || Date.now() - that.requestTimestamp > 30000) {
      requestNext(that);
    }
  } else {
    canIUseRequest && my.request(send);
  }
}
export function cutUrlSearch(t) {
  return t && "string" == typeof t
    ? t.replace(/^(.*?https?:)?\/\//, "").replace(/\?.*$/, "")
    : "";
}

export function checkAPI(t, e) {
  if (!t || "string" != typeof t) {
    return !1;
  }
  var n = /webtrack\.allcitygo\.com[\w-]*/.test(t); ///openmonitor(\.(dev|sit|test))?\.alipay[\w-]*/.test(t);
  //webtrack
  return !n && e && (n = /(\.png)|(\.gif)|(alicdn\.com)/.test(t)), !n;
}
export function getPropertyValue(j:any, arr:string[]) {
  if (!arr) return undefined
  for (var k in j) {
    if (arr.indexOf(k) > -1) {
      return ""+j[k] 
    }
  }
  return undefined
}
export function ext(t: any, ..._: any[]) {
  for (var e = 1, n = arguments.length; e < n; e++) {
    var r = arguments[e];
    for (var o in r) {
      Object.prototype.hasOwnProperty.call(r, o) && (t[o] = r[o]);
    }
  }
  return t;
}
export function isObject(d) {
  return "object" == typeof d;
}
export function isString(d) {
  return "string" == typeof d;
}
export function isJSON(str: any, pass_object: boolean = false): boolean {
  if (pass_object && isObject(str)) return true;

  if (!isString(str)) return false;

  str = str.replace(/\s/g, "").replace(/\n|\r/, "");

  if (/^\{(.*?)\}$/.test(str)) return /"(.*?)":(.*?)/g.test(str);

  if (/^\[(.*?)\]$/.test(str)) {
    return str
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .replace(/},{/g, "}\n{")
      .split(/\n/)
      .map(function (s) {
        return isJSON(s);
      })
      .reduce(function (_, curr:any) {
        return !!curr;
      });
  }

  return false;
}
export function hookRequest(mtr) {
  if ("undefined" != typeof my && my && "function" == typeof my.request) {
    var _request = my.request;
    var reqDes = Object.getOwnPropertyDescriptor(my, "request");
    reqDes &&
      reqDes.writable &&
      (my.request = function (sendData) {
        var t0 = new Date().getTime();
        var sendData2 = sendData;
        if (sendData && !sendData.noTracker && sendData.url) {
          var api = cutUrlSearch(sendData.url);
          if (!checkAPI(api, true)) {
            return _request.call(my, sendData2);
          }
          /*
          var headers = sendData && sendData.headers;
          (headers && "object" == typeof headers) || (headers = {});
          */
          let p = {
            success: function (res) {
              "function" == typeof sendData.success && sendData.success(res);
              var t1 = new Date().getTime(),
                code:string|undefined = "",
                msg: string|any = "",
                response:string|undefined = "";

              if (
                res &&
                res.data &&
                (!sendData.dataType ||
                  sendData.dataType === "json" ||
                  "object" == typeof res.data)
              ) {
                var d = res.data;
                code = getPropertyValue(d,['code','stat','status','success'])
               /* (d.code!=undefined && ""+d.code) || 
                (d.stat!=undefined && ""+d.stat) ||
                (d.status!=undefined && ""+d.status)  ||                      
                (d.success!=undefined && ""+d.success)  || undefined*/
                if(code ==undefined && mtr.code && mtr.code.length)
                  code = getPropertyValue(d, mtr.code)
                msg =  getPropertyValue(d,['msg','message','subMsg','errorMsg',"ret",'errorResponse'])                   
                /*  d.msg ||
                  d.message ||
                  d.subMsg ||
                  d.errorMsg ||
                  d.ret ||
                  d.errorResponse */
                if(msg ==undefined && mtr.msg && mtr.msg.length)
                  code = getPropertyValue(d, mtr.msg) || "";
                if('string'!= typeof msg  &&"object" == typeof msg)
                  { 
                    code = code || msg.code
                    msg =  msg.msg ||  msg.message ||   msg.info ||   msg.ret || JSON.stringify(msg);
                  }
                response = (response = JSON.stringify(d)).substr(0, 1000);
              } else if (res) {
                try {
                  var d = res.data || res;
                  response = (response = JSON.stringify(d)).substr(0, 1000);
                  if (
                    res.data &&
                    "string" == typeof res.data &&
                    isJSON(res.data)
                  ) {
                    d = JSON.parse(res.data);
                    code = getPropertyValue(d,['code','stat','status','success'])
                     /* (d.code!=undefined && ""+d.code) || 
                      (d.stat!=undefined && ""+d.stat) ||
                      (d.status!=undefined && ""+d.status)  ||                      
                      (d.success!=undefined && ""+d.success)  || undefined*/
                    if(code ==undefined && mtr.code && mtr.code.length)
                      code = getPropertyValue(d, mtr.code)
                    msg =   getPropertyValue(d,['msg','message','subMsg','errorMsg',"ret",'errorResponse'])                    
                     /* d.msg ||
                      d.message ||
                      d.subMsg ||
                      d.errorMsg ||
                      d.ret ||
                      d.errorResponse */
                    if(msg ==undefined && mtr.msg && mtr.msg.length)
                      {
                        code = getPropertyValue(d, mtr.msg) || "";
                      }
                    if('string'!= typeof msg  &&"object" == typeof msg)
                      { 
                        code = code || msg.code
                        msg =  msg.msg ||  msg.message ||   msg.info ||   msg.ret || JSON.stringify(msg);
                      }
                  }
                } catch (e) {
                  console.warn(e);
                }
              }
              let time = t1 - t0;
              let bizSuccess =
                code == "20000" ||
                code == "200" ||
                code == "0" ||
                msg == "Success" ||
                msg == "success" ||
                msg == "SUCCESS";
              if (bizSuccess) {
                mtr.stat_api_success &&
                  time > mtr.stat_api_long_time &&
                  mtr.api({
                    api,
                    success: true,
                    time: time,
                    code,
                    msg,
                    bizSuccess,
                    response
                  });
              } else {
                mtr.stat_api_fail &&
                  mtr.api({
                    api,
                    success: true,
                    time: time,
                    code,
                    msg,
                    bizSuccess,
                    response
                  });
              }
            },
            fail: function (res) {
              /**
               * data:{bizSuc: false, code: 401, message: "用户未登录", msg: "用户未登录", suc: false}
error
:
19
errorMessage
:
"http status error"
headers
:
{Connection: "close", Content-Type: "application/json;charset=UTF-8", Date: "Thu, 16 Jan 2020 12:24:03 GMT", Server: "openresty", Transfer-Encoding: "chunked"}
status
:
401
               */
              "function" == typeof sendData.fail && sendData.fail(res);
              var t1 = new Date().getTime();
              var code = "";
              var msg = "";
              var response = "";
              if (res) {
                code =
                  (res.data &&
                    "object" == typeof res.data &&
                    (res.data.code || res.data.status || res.data.error)) ||
                  res.status ||
                  res.error;

                msg =
                  (res.data &&
                    "object" == typeof res.data &&
                    (res.data.msg || res.data.message)) ||
                  res.errorMessage ||
                  res.error;

                var d = res.data || res;
                response = (response = JSON.stringify(d)).substr(0, 1000);
                //if (res.data) { response = (response = JSON.stringify(res.data)).substring(0, 1000) }
                //response = response || (response = JSON.stringify(res)).substring(0, 1000)
              }
              mtr.stat_api_fail &&
                mtr.api({
                  api,
                  success: false,
                  time: t1 - t0,
                  code,
                  msg,
                  bizSuccess: false,
                  response
                });
            }
          };
          sendData2 = ext({}, sendData2, p);
        }
        return _request.call(my, sendData2);
      });
  }
}
export function hookGetLocation(mtr) {
  if ("undefined" != typeof my && my && "function" == typeof my.getLocation) {
    var _getLocation = my.getLocation;
    var des = Object.getOwnPropertyDescriptor(my, "getLocation");
    des &&
      des.writable &&
      (my.getLocation = function (data:any) {
        let p = data
        if (data) {
          p = {
            success: function (res:any) {
              "function" == typeof data.success && data.success(res);
              let { longitude, latitude, city, cityAdcode, district, districtAdcode } = res
              let location: any = { longitude, latitude }
              city && (location.city = city)
              cityAdcode && (location.cityAdcode = cityAdcode)
              district && (location.district = district)
              districtAdcode && (location.districtAdcode = districtAdcode)
              mtr.location = location
            }
          }
          p = ext({}, data, p);
        }

        return _getLocation.call(my, p);
      });
  }
}

