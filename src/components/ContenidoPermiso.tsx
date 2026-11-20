import { router } from 'expo-router';

import EstadoCargando from '@/components/EstadoCargando';
import ExplicacionPermiso from '@/components/ExplicacionPermiso';
import { useBiblioteca } from '@/context/BibliotecaContext';
import { usePermiso } from '@/hooks/usePermiso';
import type { RecursoPermiso } from '@/types/permisos';

type Props = {
  recurso: RecursoPermiso;
  isbn?: string; // libro cuyo recordatorio se activa cuando se concede el permiso
};

export default function ContenidoPermiso({ recurso, isbn }: Props) {
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);
  const { activarRecordatorio } = useBiblioteca();

  if (estado === 'cargando') {
    return <EstadoCargando mensaje="Consultando el permiso..." />;
  }

  async function continuar() {
    const resultado = await pedir();
    if (recurso === 'notificaciones' && resultado === 'concedido' && isbn) {
      await activarRecordatorio(isbn);
    }
    router.back();
  }

  return (
    <ExplicacionPermiso
      recurso={recurso}
      estado={estado}
      onContinuar={continuar}
      onAbrirAjustes={abrirAjustes}
    />
  );
}
