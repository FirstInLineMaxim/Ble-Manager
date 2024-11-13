import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import BleManager from 'react-native-ble-manager';

const DeviceItem = ({ peripheral, connect, disconnect }) => {
    const [deviceInfo, setDeviceInfo] = useState(null);

    useEffect(() => {
        if (peripheral.connected) {
            const info = {};
            BleManager.retrieveServices(peripheral.id)
                .then(async (peripheralInfo) => {


                    // Store the characteristics data alongside their identifiers for later use
                    const promises = peripheralInfo.characteristics?.map(async (char) => {
                        try {
                            const value = await BleManager.read(
                                peripheral.id,
                                char.service,
                                char.characteristic
                            );
                            return { char, value };  // Return both characteristic and its value
                        } catch (error) {
                            console.error("[readCharacteristics] Error reading characteristic", error);
                            return { char, error };  // Return the error if the read fails
                        }
                    });

                    // Wait for all promises to settle
                    const results = await Promise.allSettled(promises);

                    results.forEach(({ status, value, reason }) => {
                        if (status === "fulfilled" && value) {
                            const { char, value: characteristicValue } = value;

                            // Convert byte array to string
                            const decodedValue = String.fromCharCode(...characteristicValue);

                            console.log("[readCharacteristics]", "peripheralId", peripheral.id, "service", char.service, "char", char.characteristic, "\n\tvalue", decodedValue);

                            // Update info based on the characteristic
                            if (char.characteristic === '2a29') {
                                info.manufacturer = decodedValue; // Manufacturer
                            }
                            if (char.characteristic === '2a25') {
                                info.mac = decodedValue; // Mac Address
                            }
                            if (char.characteristic === '2a24') {
                                info.model = decodedValue; // Model name
                            }
                            if (char.characteristic === '2a27') {
                                info.hardwareRevision = decodedValue; // Hardware revision
                            }
                            if (char.characteristic === '2a26') {
                                info.firmwareRevision = decodedValue; // Firmware revision
                            }
                            if (char.characteristic === '2a28') {
                                info.softwareRevision = decodedValue; // Software revision
                            }
                        } else if (status === "rejected") {
                            console.error("[readCharacteristics] Error reading characteristic", reason);
                        }
                    });

                })
                .catch((error) => {
                    console.error('Failed to retrieve services:', error);
                }).finally(() => {
                    console.log("till here ")
                    setDeviceInfo(info); // Update state with the info object
                })
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
                    <Text>MAC: {deviceInfo.mac || 'N/A'}</Text>
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
        marginBottom: 15,
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
