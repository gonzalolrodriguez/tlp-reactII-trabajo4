import { Tabs } from 'expo-router/js-tabs';

import IconoTab from '@/components/IconoTab';
import { COLORES } from '@/constants/tema';

export default function LayoutTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORES.primario }}>
      <Tabs.Screen
        name="(catalogo)"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ focused }) => <IconoTab nombre="library" activo={focused} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ focused }) => <IconoTab nombre="bookmark" activo={focused} />,
        }}
      />
    </Tabs>
  );
}
