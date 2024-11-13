import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { DeviceInfo, parseCharacteristicResults } from './utils';



const DeviceItem = ({ peripheral, connect, disconnect }) => {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
        model: 'N/A',
        serialNumber: 'N/A',
        firmwareRevision: 'N/A',
        hardwareRevision: 'N/A',
        softwareRevision: 'N/A',
        manufacturer: 'N/A'
    });

    async function fetchDeviceInfo(peripheralId: string): Promise<void> {


        try {
            const peripheralInfo = await BleManager.retrieveServices(peripheralId);
            // Parse results into a DeviceInfo object
            const info = parseCharacteristicResults(peripheralInfo);
            setDeviceInfo(info)
        } catch (error) {
            console.error('Failed to retrieve services:', error);
        }


    }
    useEffect(() => {
        if (peripheral.connected) {
            fetchDeviceInfo(peripheral.id)
        }
    }, [peripheral.connected]);

    return (
        <View style={styles.deviceItem}>
            <Text style={styles.deviceName}>{peripheral.name || 'Unknown Device'}</Text>
            <Text style={styles.deviceId}>ID: {peripheral.id}</Text>

            {deviceInfo ? (
                <>
                    <Text>Manufacturer: {deviceInfo.manufacturer || 'N/A'}</Text>
                    <Text>Model: {deviceInfo.model || 'N/A'}</Text>
                    <Text>Serial Number: {deviceInfo.serialNumber || 'N/A'}</Text>
                    <Text>Hardware: {deviceInfo.hardwareRevision || 'N/A'}</Text>
                    <Text>Firmware: {deviceInfo.firmwareRevision || 'N/A'}</Text>
                    <Text>Software: {deviceInfo.softwareRevision || 'N/A'}</Text>
                </>
            ) : (
                <Text>Loading device information...</Text>
            )}

            <View style={styles.deviceActions}>
                {!peripheral.connected ? (
                    <TouchableOpacity onPress={() => connect(peripheral)}>
                        <Text style={styles.connectButton}>Connect</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => disconnect(peripheral)}>
                        <Text style={styles.disconnectButton}>Disconnect</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    deviceItem: {
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    deviceId: {
        fontSize: 14,
        color: '#888',
    },
    deviceActions: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    connectButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        color: 'white',
    },
    disconnectButton: {
        backgroundColor: '#F44336',
        padding: 10,
        borderRadius: 5,
        color: 'white',
    },
});

export default DeviceItem;
