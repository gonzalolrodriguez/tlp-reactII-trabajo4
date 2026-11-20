import { Stack } from 'expo-router';

import { useBiblioteca } from '@/context/BibliotecaContext';

// Stack raíz: login solo existe sin sesión y mostrador solo con sesión.
export default function NavegacionRaiz() {
  const { sesion } = useBiblioteca();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Stack.Screen name="escanear" options={{ title: 'Escanear' }} />
      <Stack.Screen name="reservar/[isbn]" options={{ title: 'Reservar', presentation: 'modal' }} />
      <Stack.Screen name="permisos/[recurso]" options={{ title: 'Permiso', presentation: 'modal' }} />
      <Stack.Protected guard={!sesion}>
        <Stack.Screen
          name="login"
          options={{ title: 'Ingreso del personal', presentation: 'modal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={sesion}>
        <Stack.Screen name="mostrador" options={{ title: 'Mostrador' }} />
      </Stack.Protected>
    </Stack>
  );
}
