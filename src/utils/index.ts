import { PeripheralInfo } from "react-native-ble-manager";

type CharacteristicData = {
    char: {
        service: string;
        characteristic: string;
    };
    value?: number[];
    error?: any;
};

export type DeviceInfo = {
    model: string;
    serialNumber: string;
    firmwareRevision: string;
    hardwareRevision: string;
    softwareRevision: string;
    manufacturer: string;
};

export function decodeCharacteristicValue(characteristicValue: number[]): string {
    return String.fromCharCode(...characteristicValue);
}

export function parseCharacteristicResults(
    PeripheralInfo: PeripheralInfo
): DeviceInfo {
    const info: DeviceInfo = {
        model: 'N/A',
        serialNumber: 'N/A',
        firmwareRevision: 'N/A',
        hardwareRevision: 'N/A',
        softwareRevision: 'N/A',
        manufacturer: 'N/A'
    };


    PeripheralInfo.characteristics?.forEach((char) => {

        const decodedValue = decodeCharacteristicValue(char?.value?.bytes ?? []);

        switch (char.characteristic.toLowerCase()) {
            case "2a24":
                info.model = decodedValue;
                break;
            case "2a25":
                info.serialNumber = decodedValue;
                break;
            case "2a26":
                info.firmwareRevision = decodedValue;
                break;
            case "2a27":
                info.hardwareRevision = decodedValue;
                break;
            case "2a28":
                info.softwareRevision = decodedValue;
                break;
            case "2a29":
                info.manufacturer = decodedValue;
                break;
            default:
                console.log(`[Read Characteristic] Unhandled characteristic: ${char.characteristic}`);
        }

    });

    return info;
}