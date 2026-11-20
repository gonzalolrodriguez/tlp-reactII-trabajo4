import { Pila } from './Pila';

describe('Pila', () => {
  it('empieza vacía', () => {
    const pila = new Pila<string>();
    expect(pila.vacia).toBe(true);
    expect(pila.tamanio).toBe(0);
    expect(pila.tope()).toBeUndefined();
  });

  it('el último en entrar es el tope (último en entrar, primero en salir)', () => {
    const pila = new Pila<string>();
    pila.push('A');
    pila.push('B');

    expect(pila.tope()).toBe('B');
    expect(pila.pop()).toBe('B');
    expect(pila.pop()).toBe('A');
  });

  it('pop en una pila vacía devuelve undefined', () => {
    const pila = new Pila<string>();
    expect(pila.pop()).toBeUndefined();
  });

  it('tope no saca el elemento', () => {
    const pila = new Pila<number>();
    pila.push(1);
    pila.tope();

    expect(pila.tamanio).toBe(1);
  });

  it('aArray va de la base al tope', () => {
    const pila = new Pila<number>();
    pila.push(1);
    pila.push(2);
    pila.push(3);

    expect(pila.aArray()).toEqual([1, 2, 3]);
  });

  it('limpiar vacía la pila', () => {
    const pila = new Pila<number>();
    pila.push(1);
    pila.limpiar();

    expect(pila.vacia).toBe(true);
  });
});
