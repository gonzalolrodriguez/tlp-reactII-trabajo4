import type { Libro } from '../types';

// Los dos primeros libros son reales y se pueden escanear con su código de barras.
export const LIBROS: Libro[] = [
  { isbn: '9788478884452', titulo: 'Harry Potter y la piedra filosofal', autor: 'J. K. Rowling', anio: 1997, ejemplares: 3 },
  { isbn: '9788499089508', titulo: 'Ficciones', autor: 'Jorge Luis Borges', anio: 1944, ejemplares: 2 },
  { isbn: '9788420674124', titulo: 'El Aleph', autor: 'Jorge Luis Borges', anio: 1949, ejemplares: 0 },
  { isbn: '9780307474728', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio: 1967, ejemplares: 2 },
  { isbn: '9788420471891', titulo: 'Rayuela', autor: 'Julio Cortázar', anio: 1963, ejemplares: 1 },
  { isbn: '9788478887194', titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', anio: 1943, ejemplares: 4 },
  { isbn: '9780451524935', titulo: '1984', autor: 'George Orwell', anio: 1949, ejemplares: 0 },
  { isbn: '9789504941507', titulo: 'El túnel', autor: 'Ernesto Sabato', anio: 1948, ejemplares: 2 },
  { isbn: '9788437604183', titulo: 'Pedro Páramo', autor: 'Juan Rulfo', anio: 1955, ejemplares: 0 },
  { isbn: '9788497592208', titulo: 'Crónica de una muerte anunciada', autor: 'Gabriel García Márquez', anio: 1981, ejemplares: 1 },
  { isbn: '9788401337208', titulo: 'La casa de los espíritus', autor: 'Isabel Allende', anio: 1982, ejemplares: 2 },
  { isbn: '9789871138197', titulo: 'Martín Fierro', autor: 'José Hernández', anio: 1872, ejemplares: 0 },
  { isbn: '9788466341974', titulo: 'La ciudad y los perros', autor: 'Mario Vargas Llosa', anio: 1963, ejemplares: 1 },
  { isbn: '9788437604947', titulo: 'Sobre héroes y tumbas', autor: 'Ernesto Sabato', anio: 1961, ejemplares: 3 },
  { isbn: '9789500397117', titulo: 'Facundo', autor: 'Domingo Faustino Sarmiento', anio: 1845, ejemplares: 2 },
  { isbn: '9788439732075', titulo: 'Bestiario', autor: 'Julio Cortázar', anio: 1951, ejemplares: 1 },
  { isbn: '9788420412146', titulo: 'El amor en los tiempos del cólera', autor: 'Gabriel García Márquez', anio: 1985, ejemplares: 2 },
];
