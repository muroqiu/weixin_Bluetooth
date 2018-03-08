# weixin_Bluetooth
微信蓝牙测试

#### 简单介绍下流程：
* 初始化小程序蓝牙模块 openBluetoothAdapter；
* 获取手机系统已连接的蓝牙设备 getConnectedBluetoothDevices；
* 建立BLE连接 createBLEConnection；
* 获取BLE服务的UUID及相关特征值Characteristics的UUID，设置设备数据变化监听；
* 向蓝牙设备发送测试数据 writeBLECharacteristicValue；