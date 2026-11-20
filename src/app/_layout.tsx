import NavegacionRaiz from '@/components/NavegacionRaiz';
import { ProveedorBiblioteca } from '@/context/BibliotecaContext';

// Un deep link a /buscar deja las pestañas debajo en la pila.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function LayoutRaiz() {
  return (
    <ProveedorBiblioteca>
      <NavegacionRaiz />
    </ProveedorBiblioteca>
  );
}
