import { Cola } from './Cola';

describe('Cola', () => {
  it('empieza vacía', () => {
    const cola = new Cola<string>();
    expect(cola.vacia).toBe(true);
    expect(cola.tamanio).toBe(0);
    expect(cola.aArray()).toEqual([]);
  });

  it('desencola en el orden en que se encoló (primero en entrar, primero en salir)', () => {
    const cola = new Cola<string>();
    cola.encolar('Ana');
    cola.encolar('Luis');
    cola.encolar('Marta');

    expect(cola.desencolar()).toBe('Ana');
    expect(cola.desencolar()).toBe('Luis');
    expect(cola.desencolar()).toBe('Marta');
  });

  it('desencolar una cola vacía devuelve undefined y no rompe', () => {
    const cola = new Cola<string>();
    expect(cola.desencolar()).toBeUndefined();
    expect(cola.tamanio).toBe(0);
  });

  it('frente muestra al primero sin sacarlo', () => {
    const cola = new Cola<string>();
    cola.encolar('Ana');
    cola.encolar('Luis');

    expect(cola.frente()).toBe('Ana');
    expect(cola.tamanio).toBe(2);
  });

  it('el tamaño baja al desencolar', () => {
    const cola = new Cola<number>();
    cola.encolar(1);
    cola.encolar(2);
    cola.desencolar();

    expect(cola.tamanio).toBe(1);
    expect(cola.aArray()).toEqual([2]);
  });

  it('vuelve a estar vacía después de desencolar todo', () => {
    const cola = new Cola<number>();
    cola.encolar(1);
    cola.desencolar();

    expect(cola.vacia).toBe(true);
    expect(cola.frente()).toBeUndefined();
  });

  it('aArray devuelve una copia: modificarla no cambia la cola', () => {
    const cola = new Cola<number>();
    cola.encolar(1);
    const copia = cola.aArray();
    copia.push(99);

    expect(cola.tamanio).toBe(1);
  });
});
