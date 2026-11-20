import { LARGO_ISBN } from '../constants/config';
import { LIBROS } from '../data/libros';
import type { Libro } from '../types';

const REGEX_ISBN = new RegExp(`^\\d{${LARGO_ISBN}}$`);

export function esIsbnValido(isbn: string): boolean {
  return REGEX_ISBN.test(isbn);
}

export function buscarLibroPorIsbn(isbn: string): Libro | undefined {
  return LIBROS.find((libro) => libro.isbn === isbn);
}
