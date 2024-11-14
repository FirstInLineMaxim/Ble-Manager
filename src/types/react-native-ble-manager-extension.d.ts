// src/types/react-native-ble-manager.d.ts
import 'react-native-ble-manager';
declare module 'react-native-ble-manager' {
    // enrich local contract with custom state properties needed by App.tsx
    interface Peripheral {
        connected?: boolean;
        connecting?: boolean;
    }
}