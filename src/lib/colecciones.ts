import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';

// React solo se entera de un cambio si el estado es un objeto nuevo.
// Por eso nunca se muta una Pila o una Cola guardada en el estado:
// se arma una copia, se modifica la copia y se guarda la copia.

export function copiarCola<T>(original: Cola<T>): Cola<T> {
  const copia = new Cola<T>();
  original.aArray().forEach((item) => copia.encolar(item));
  return copia;
}

export function copiarPila<T>(original: Pila<T>): Pila<T> {
  const copia = new Pila<T>();
  original.aArray().forEach((item) => copia.push(item));
  return copia;
}

export function colaDesdeArray<T>(items: T[]): Cola<T> {
  const cola = new Cola<T>();
  items.forEach((item) => cola.encolar(item));
  return cola;
}

export function crearEsperasIniciales(
  datos: Record<string, string[]>,
): Record<string, Cola<string>> {
  const esperas: Record<string, Cola<string>> = {};
  Object.keys(datos).forEach((isbn) => {
    esperas[isbn] = colaDesdeArray(datos[isbn]);
  });
  return esperas;
}
