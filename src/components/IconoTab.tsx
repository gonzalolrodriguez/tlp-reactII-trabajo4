import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { COLORES, TAMANIOS } from '@/constants/tema';

type Props = {
  nombre: ComponentProps<typeof Ionicons>['name'];
  activo: boolean;
};

export default function IconoTab({ nombre, activo }: Props) {
  const color = activo ? COLORES.primario : COLORES.textoSuave;
  return <Ionicons name={nombre} color={color} size={TAMANIOS.iconoTab} />;
}
