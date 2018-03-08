//index.js
//获取应用实例
const app = getApp()

const SERVICE_UUID = "91680001-1111-6666-8888-0123456789AB"
const WRITE_UUID = "91680002-1111-6666-8888-0123456789AB"
const NOTIFY_UUID = "91680003-1111-6666-8888-0123456789AB"

// 
var mDeviceID = 'FF:22:F8:CB:68:F9'
// var mDeviceID = "7ECAADA5-3336-1B67-069B-287DF71EAF91"

Page({
  data: {
    debugMsg: '......'
  },

  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onLoad: function () {
  },

  /**
   * 初始化小程序蓝牙模块
   */
  openBluetoothAdapter: function () {
    var that = this;
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
        // 监听蓝牙适配器状态变化
        wx.onBluetoothAdapterStateChange(function (res) {
          console.log(res)
        })
        // 发现新设备
        wx.onBluetoothDeviceFound(function (devices) {
          console.log(devices)
        })
      },

      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      }
    })
  },

  /**
   * 根据 uuid 获取手机系统已连接的蓝牙设备
   */
  getConnectedBluetoothDevices: function () {
    var that = this;
    wx.getConnectedBluetoothDevices({
      services: [SERVICE_UUID],
      success: function (res) {
        console.log(res)
        // 连接第一个目标设备做测试
        if (res.devices[0]) {
          mDeviceID = res.devices[0].deviceId;
        }
      }
    })
  },

  /**
   * 建立BLE连接
   */
  createBLEConnection: function (e) {
    var that = this;
    wx.createBLEConnection({
      // 这里的 deviceId 由 getConnectedBluetoothDevices 获取
      deviceId: mDeviceID,
      success: function (res) {
        console.log(res)
        // 获取BLE服务
        that.getBLEDeviceServices()
        // 监听BLE连接状态变化
        wx.onBLEConnectionStateChange(function (res) {
          // 该方法回调中可以用于处理连接意外断开等异常情况
          console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
        })
      },
      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      },
    })
  },

  /**
   * 获取蓝牙设备所有 service（服务）
   */
  getBLEDeviceServices: function () {
    var that = this;
    wx.getBLEDeviceServices({
      deviceId: mDeviceID,
      success: function (res) {
        console.log('device services:', res.services)

        // 获取BLE服务的特征值characteristic
        that.getBLEDeviceCharacteristics()
      },
      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      },
    })
  },

  /**
   * 获取蓝牙设备某个服务中的所有 characteristic（特征值）
   */
  getBLEDeviceCharacteristics: function () {
    var that = this;
    wx.getBLEDeviceCharacteristics({
      deviceId: mDeviceID,
      serviceId: SERVICE_UUID,
      success: function (res) {
        console.log('device getBLEDeviceCharacteristics:', res.characteristics)

        // 设置设备Notify
        that.notifyBLECharacteristicValueChange() 
      },
      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      },
    })
  },

  ab2hex: function (buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },

  /**
   * 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。注意：必须设备的特征值支持notify或者
   * indicate才可以成功调用，具体参照characteristic 的 properties 属性
   */
  notifyBLECharacteristicValueChange: function () {
    var that = this;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      deviceId: mDeviceID,
      serviceId: SERVICE_UUID,
      characteristicId: NOTIFY_UUID,
      success: function (res) {
        console.log(res)
        // 监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
        wx.onBLECharacteristicValueChange(function (res) {
          console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
          console.log(that.ab2hex(res.value))
        })
      },
      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      },
    })
  },

  /**
   * 向蓝牙设备发送数据
   */
  writeBLECharacteristicValue: function () {
    var that = this;
    // 向蓝牙设备发送一个0x00的16进制数据
    let buffer = new ArrayBuffer(1)
    let dataView = new DataView(buffer)
    dataView.setUint8(0, 0)

    wx.writeBLECharacteristicValue({
      deviceId: mDeviceID,
      serviceId: SERVICE_UUID,
      characteristicId: WRITE_UUID,
      // 这里的value是ArrayBuffer类型
      value: buffer,
      success: function (res) {
        console.log('writeBLECharacteristicValue success', res.errMsg)
      },
      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      },
    })
  },

  /**
   * 搜索蓝牙设备
   */
  startBluetoothDevicesDiscovery: function (e) {
    var that = this;
    wx.startBluetoothDevicesDiscovery({
      services: [SERVICE_UUID],
      success: function (res) {
        console.log(res)
      },
      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      },
    })
  },

  /**
   * 关闭蓝牙连接
   */
  onCloseConnection: function () {
    wx.closeBLEConnection({
      deviceId: mDeviceID,
      success: function (res) {
        console.log(res)
      }
    })
  },
})
