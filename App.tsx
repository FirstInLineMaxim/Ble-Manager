/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */

import React, { useState, useEffect } from 'react';
import {
  Text, View,
  FlatList,
  Platform,
  StatusBar,
  SafeAreaView,
  NativeModules,
  useColorScheme,
  TouchableOpacity,
  NativeEventEmitter,
  PermissionsAndroid
} from 'react-native';
import { styles } from './src/styles/styles';
import BleManager, { BleDisconnectPeripheralEvent, Peripheral } from 'react-native-ble-manager';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import DeviceItem from './src/DeviceItem';

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const [peripherals, setPeripherals] = useState<Map<Peripheral['id'], Peripheral>>(
    new Map(),
  );
  const [isScanning, setIsScanning] = useState(false);

  const handleLocationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[handleLocationPermission] Location permission granted');
        } else {
          console.log('[handleLocationPermission] Location permission denied');
        }
      } catch (error) {
        console.log('[handleLocationPermission] Error requesting location permission:', error);
      }
    }
  };

  const handleGetConnectedDevices = () => {
    BleManager.getBondedPeripherals().then(results => {
      for (let i = 0; i < results.length; i++) {
        let peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);

      }
    });
  };
  const handleDisconnectedPeripheral = (
    event: BleDisconnectPeripheralEvent,
  ) => {
    console.debug(
      `[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`,
    );
    setPeripherals(map => {
      let p = map.get(event.peripheral);
      if (p) {
        p.connected = false;
        return new Map(map.set(event.peripheral, p));
      }
      return map;
    });
  };
  useEffect(() => {
    handleLocationPermission();

    BleManager.enableBluetooth().then(() => {
      console.log('Bluetooth is turned on!');
    });

    BleManager.start({ showAlert: false }).then(() => {
      console.log('BleManager initialized');
      handleGetConnectedDevices();
    });

    let stopDiscoverListener = BleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      peripheral => {
        if (peripheral.name === "nRF5x") {
          setPeripherals(map => {
            peripheral.connecting = false;
            peripheral.connected = false;
            return new Map(map.set(peripheral.id, peripheral));
          });
        }
      },
    );

    let stopConnectListener = BleManagerEmitter.addListener(
      'BleManagerConnectPeripheral',
      peripheral => {
        console.log('BleManagerConnectPeripheral:', peripheral);
      },
    );
    let disconnectedLister = BleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral
    );
    let stopScanListener = BleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        setIsScanning(false);
        console.log('scan stopped');
      },
    );

    return () => {
      stopDiscoverListener.remove();
      stopConnectListener.remove();
      stopScanListener.remove();
    };
  }, []);

  const scan = () => {
    if (!isScanning) {
      // reset found peripherals before scan
      setPeripherals(new Map());
      BleManager.scan([], 5, true)
        .then(() => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(error => {
          console.error(error);
        });
    }
  };
  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const connect = async (peripheral: Peripheral) => {
    try {
      setPeripherals(map => {
        let p = map.get(peripheral.id);
        if (p) {
          p.connecting = true;
          return new Map(map.set(p.id, p));
        }
        return map;
      });
      // Connect to the peripheral
      await BleManager.connect(peripheral.id);
      console.log('Connected to', peripheral.id);
      setPeripherals(map => {
        let p = map.get(peripheral.id);
        console.log(p)
        if (p) {
          p.connecting = false;
          p.connected = true;
          return new Map(map.set(p.id, p));
        }
        return map;
      });

    } catch (error) {
      // Handle errors here
      console.error('Failed to connect or create bond:', error);
      throw new Error('Failed to connect or create bond');
    }
  };


  const disconnect = (peripheral: Peripheral) => {
    BleManager.disconnect(peripheral.id)
      .then(() => {

        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = false;
            p.connected = false;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        // Alert.alert(`Disconnected from ${peripheral.name}`);
      })
      .catch(() => {
        throw Error('fail to remove the bond');
      });
  };

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const stopScan = () => {
    BleManager.stopScan().then(() => {
      // Success code
      console.log("Scan stopped");
    });
  }
  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={{ paddingHorizontal: 20 }}>
        <Text
          style={[
            styles.title,
            { color: isDarkMode ? Colors.white : Colors.black },
          ]}>
          React Native BLE Manager Tutorial
        </Text>
        <TouchableOpacity
          onPress={() => isScanning ? stopScan() : scan()}
          activeOpacity={0.5}
          style={styles.scanButton}>
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan Bluetooth Devices'}
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.subtitle,
            { color: isDarkMode ? Colors.white : Colors.black },
          ]}>
          Discovered Devices:
        </Text>
        {Array.from(peripherals.values()).length > 0 ? (
          <FlatList
            data={Array.from(peripherals.values())}
            renderItem={({ item }) => (
              <DeviceItem
                peripheral={item}
                connect={connect}
                disconnect={disconnect}
              />
            )}
            keyExtractor={item => item.id}
          />
        ) : (
          <Text style={styles.noDevicesText}>No Bluetooth devices found</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default App;
