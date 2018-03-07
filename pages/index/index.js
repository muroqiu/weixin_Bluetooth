//index.js
//获取应用实例
const app = getApp()

const SERVICE_UUID = "91680001-1111-6666-8888-0123456789AB"
const WRITE_UUID = "91680002-1111-6666-8888-0123456789AB"
const NOTIFY_UUID = "91680003-1111-6666-8888-0123456789AB"

// var mDeviceID = 'FF:22:F8:CB:68:F9'
var mDeviceID = "7ECAADA5-3336-1B67-069B-287DF71EAF91"

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
   * 打开系统蓝牙
   */
  openBluetooth: function () {
    var that = this;
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
        // 监听蓝牙适配器状态变化
        wx.onBluetoothAdapterStateChange(function (res) {
          // console.log(res)
          that.setData({
            // debugMsg: res.errMsg
          })
        })
        // 发现新设备
        wx.onBluetoothDeviceFound(function (devices) {
          console.log(devices)
          that.setData({
            // debugMsg: devices[0].advertisServiceUUIDss
          })
        })
      },

      fail: function (res) {
        // console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      }
    })
  },

  /**
   * 搜索蓝牙设备
   */
  startBluetoothDevicesDiscovery: function (e) {
    var that = this;
    // 以微信硬件平台的蓝牙智能灯为例，主服务的 UUID 是 FEE7。传入这个参数，只搜索主服务 UUID 为 FEE7 的设备
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
   * 根据 uuid 获取处于已连接状态的设备
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
   * 建立蓝牙连接
   */
  createBLEConnection: function (e) {
    var that = this;
    wx.createBLEConnection({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接 
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
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
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
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: mDeviceID,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
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

  /**
   * 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照characteristic 的 properties 属性
   */
  notifyBLECharacteristicValueChange: function () {
    var that = this;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接  
      deviceId: mDeviceID,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: SERVICE_UUID,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: NOTIFY_UUID,
      success: function (res) {
        console.log(res)
        // 监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
        wx.onBLECharacteristicValueChange(function (res) {
          console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
          console.log(that.ab2hex(res.value))

          wx.readBLECharacteristicValue({
            // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接  [**new**]
            deviceId: mDeviceID,
            // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
            serviceId: SERVICE_UUID,
            // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
            characteristicId: NOTIFY_UUID,
            success: function (res) {
              console.log('readBLECharacteristicValue:', res.errCode)
            }
          })
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

  /**
   * 写入数据
   */
  writeBLECharacteristicValue: function () {
    var that = this;
    // 向蓝牙设备发送一个0x00的16进制数据
    let buffer = new ArrayBuffer(1)
    let dataView = new DataView(buffer)
    dataView.setUint8(0, 0)

    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: mDeviceID,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: SERVICE_UUID,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
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
   * 读取数据
   */
  readBLECharacteristicValue: function () {
    var that = this;
    wx.readBLECharacteristicValue({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接  [**new**]
      deviceId: mDeviceID,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: SERVICE_UUID,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: NOTIFY_UUID,
      success: function (res) {
        console.log('readBLECharacteristicValue:', res.errCode)
      },
      fail: function (res) {
        console.log(res)
        that.setData({
          debugMsg: res.errMsg
        })
      },
    })
  },
})
