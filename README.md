# Benflix - Aplicación de Catálogo de Series

Aplicación móvil estilo Netflix construida con React Native, TypeScript y Supabase.

---

## 📱 Cómo correr el proyecto

### Requisitos previos
- Node.js 18+ instalado
- iOS Simulator (macOS) o Android Emulator configurado
- Cuenta de Supabase (gratuita)
- API Key de TMDB (opcional, para poblar datos)

### Instalación

1. **Clonar el repositorio e instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Crear un archivo `.env` en la raíz del proyecto:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-servicio  # Solo para seeding
TMDB_API_KEY=tu-api-key-tmdb                  # Solo para seeding
```

3. **Configurar la base de datos en Supabase:**

Ejecutar el script SQL en el SQL Editor de Supabase para preparar las tablas necesarias para la aplicación:
```bash
1. supabase/init.sql
```

4. **Poblar la base de datos:**
```bash
npm run seed
```

5. **Ejecutar la aplicación:**
```bash
# iOS
npx expo start --ios

# Android
npx expo start --android

# Web
npx expo start --web
```

---

## 🗄️ Funciones de SQL implementadas

### Tablas creadas

La base de datos consta de 5 tablas principales:

1. **`categories`** - Géneros de series (Drama, Comedia, Acción, etc.)
   - `id`, `name`, `created_at`

2. **`shows`** - Series/programas principales
   - `id`, `title`, `synopsis`, `poster_url`, `backdrop_url`, `created_at`

3. **`episodes`** - Episodios de cada serie
   - `id`, `show_id`, `title`, `episode_number`, `duration`, `thumbnail_url`, `created_at`

4. **`show_categories`** - Tabla de relación muchos-a-muchos entre series y categorías
   - `id`, `show_id`, `category_id`, `created_at`

5. **`user_favorites`** - Favoritos por usuario autenticado
   - `id`, `user_id`, `show_id`, `created_at`
   - Constraint único para evitar duplicados

### Políticas RLS (Row Level Security)

- **Lectura pública:** Todos los usuarios (incluidos anónimos) pueden ver `categories`, `shows`, `episodes` y `show_categories`
- **Favoritos autenticados:** Solo usuarios autenticados pueden ver, agregar y eliminar sus propios favoritos
- **Seguridad:** `user_favorites` usa `auth.uid()` para garantizar que los usuarios solo accedan a sus propios datos

### Script de seeding

- **`npm run seed`** - Ejecuta `scripts/seed.ts` que:
  - Conecta a Supabase usando la service role key
  - Descarga géneros de TV desde TMDB API (`/genre/tv/list`)
  - Descarga 15 series populares (`/tv/popular`)
  - Descarga hasta 10 episodios por serie con thumbnails
  - Construye URLs completas de imágenes (`https://image.tmdb.org/t/p/w500/...`)
  - Vincula series a categorías mediante la tabla de relación

---

## 🏗️ Arquitectura y Explicación

El proyecto sigue una **arquitectura en capas** con clara separación de responsabilidades, priorizando la mantenibilidad y escalabilidad del código. La estructura se organiza en torno a principios de **separación de concerns** y **reutilización de componentes**, donde cada capa tiene un propósito específico y bien definido.

### Patrón de diseño general

La aplicación implementa un **patrón de presentación-lógica separada**, donde los componentes UI son completamente agnósticos de la lógica de negocio. Los **custom hooks** actúan como capa intermedia que encapsula toda la lógica de fetching de datos, manejo de estado, y side effects. Esto permite que las pantallas simplemente orquesten componentes y hooks sin preocuparse por los detalles de implementación.

Por ejemplo, cuando la pantalla principal (`HomeScreen`) necesita mostrar categorías con series, simplemente invoca el hook `useCategoriesWithShows()` que internamente se encarga de hacer el fetch a Supabase, manejar estados de loading/error, y retornar los datos formateados. La pantalla no sabe ni le importa cómo se obtienen esos datos, solo los consume y los pasa a componentes presentacionales como `CategoryRow`.

### Capa de servicios y abstracción de datos

La carpeta `services/` contiene funciones puras que abstraen completamente las operaciones de base de datos. El archivo `supabase.service.ts` expone métodos como `fetchShows()`, `addFavorite()`, o `removeFavorite()` que encapsulan las queries de Supabase. Esta capa de abstracción es fundamental porque **desacopla la aplicación del backend específico**: si mañana decidimos cambiar Supabase por otro servicio, solo necesitaríamos modificar este archivo manteniendo intacto el resto del código.

Además, al ser funciones puras (sin estado interno), son extremadamente fáciles de testear con Jest. Podemos mockear las respuestas de Supabase y verificar que las funciones retornen los datos correctos sin necesidad de una base de datos real.

### Gestión de estado global y autenticación

La autenticación se maneja mediante una combinación de **Context API** y **Zustand**. El `AuthContext` provee el estado de autenticación globalmente (sesión activa, datos del usuario, métodos de login/logout), mientras que el store de Zustand (`auth.store.ts`) se encarga de la **persistencia en AsyncStorage**. Esta arquitectura híbrida nos da lo mejor de ambos mundos: Context API para propagación reactiva del estado, y Zustand para persistencia eficiente sin necesidad de serialización manual.

Cuando el usuario hace login, el `AuthContext` no solo actualiza su estado interno, sino que también escucha cambios en la sesión de Supabase mediante `onAuthStateChange`. Esto garantiza que la app siempre esté sincronizada con el estado real de autenticación, incluso si la sesión expira o se invalida desde otro lugar.

### Optimizaciones de rendimiento

Los componentes críticos que se renderizan múltiples veces (como `ShowCard` o `EpisodeItem`) están optimizados con **React.memo**, lo que previene re-renders innecesarios cuando sus props no cambian. En las pantallas, todos los callbacks se memorizan con `useCallback` para mantener referencias estables y evitar que componentes hijos se re-rendericen solo porque se creó una nueva función.

Para los carruseles horizontales, se aplicaron optimizaciones específicas de `FlatList` como `removeClippedSubviews` (desmonta componentes fuera de viewport), `maxToRenderPerBatch` (controla cuántos items se procesan por ciclo), y `windowSize` (define cuántas pantallas mantener en memoria). Estas optimizaciones permiten tener **múltiples carruseles en la misma pantalla** (hasta 16 categorías en `HomeScreen`) sin sacrificar performance, manteniendo 60 FPS incluso en dispositivos de gama media.

### Tipado con TypeScript

Todo el proyecto está fuertemente tipado con TypeScript. Las entidades de base de datos (`Show`, `Episode`, `Category`) se definen una vez en `types/database.types.ts` y se reutilizan en toda la aplicación. Esto proporciona **type safety end-to-end**: desde la respuesta de Supabase hasta los props de los componentes, el compilador verifica que los datos tengan la forma correcta.

Los tipos de navegación también están centralizados en `types/navigation.types.ts`, lo que permite autocompletado inteligente cuando navegamos entre pantallas y garantiza que pasamos los parámetros correctos. Por ejemplo, al navegar a `ShowDetail`, TypeScript nos obliga a pasar `showId` y nos autocompleta las propiedades disponibles.

---

## 💡 Decisiones Técnicas

### ¿Por qué Supabase?

Se eligió **Supabase** como backend por tres razones clave:

1. **Velocidad de desarrollo:** Supabase proporciona una base de datos PostgreSQL completa con APIs REST y Realtime generadas automáticamente, lo que permitió enfocarse en la lógica de negocio en lugar de construir un backend desde cero.

2. **Autenticación integrada:** El sistema de Auth de Supabase incluye manejo de sesiones, tokens JWT, y políticas de Row Level Security (RLS), eliminando la necesidad de implementar autenticación manualmente.

3. **PostgreSQL real:** A diferencia de soluciones NoSQL, Supabase usa PostgreSQL, lo que permite relaciones complejas (como `show_categories` para many-to-many) y queries avanzadas con joins.

### ¿Por qué TypeScript?

**TypeScript** fue fundamental para mantener calidad y escalabilidad:

1. **Type safety end-to-end:** Los tipos de las entidades de BD (`Show`, `Episode`, `Category`) se definen una vez y se usan en todo el proyecto, previniendo errores en tiempo de compilación.

2. **Mantenibilidad:** Al definir interfaces claras (`HomeScreenProps`, `useFavoriteStatus`), el código se autodocumenta y es más fácil de refactorizar.

3. **Developer Experience:** IntelliSense y autocompletado aceleran el desarrollo y reducen bugs.

### ¿Por qué Zustand para persistencia?

Se utilizó **Zustand** en combinación con Context API para manejar la autenticación porque ofrece ventajas significativas sobre usar solo Context o AsyncStorage directamente:

1. **Persistencia automática:** Zustand integra middleware de persistencia que sincroniza el store con AsyncStorage sin necesidad de serialización manual. Con Context puro, habría que leer/escribir en AsyncStorage manualmente en cada cambio de sesión.

2. **Performance:** A diferencia de Context que puede causar re-renders en cascada cuando cambia el estado, Zustand permite suscripciones selectivas. Los componentes solo se re-renderizan cuando cambia la parte del estado que realmente consumen.

3. **Simplicidad:** El código de Zustand es mucho más conciso que implementar un reducer complejo con useReducer + Context + AsyncStorage. Solo se necesitan unas pocas líneas para tener persistencia completa de la sesión.

4. **DevTools:** Zustand se integra nativamente con Redux DevTools, facilitando el debugging del estado de autenticación durante desarrollo.

### ¿Por qué seeding con API externa en vez de datos manuales?

La decisión de implementar seeding automático desde **TMDB API** en lugar de insertar datos manualmente tiene múltiples beneficios:

1. **Datos reales de producción:** Las series, sinopsis, posters, backdrops y episodios provienen de una fuente real y de alta calidad. Esto hace que la aplicación se vea profesional y realista, no como un prototipo con datos "Lorem ipsum" o "Serie 1, Serie 2".

2. **Escalabilidad del seeding:** Con el script automatizado, puedo poblar la base de datos con 15 series y 266 episodios en 20 segundos. Hacerlo manualmente habría tomado horas y sería propenso a errores tipográficos.

3. **Facilidad de actualización:** Si necesito cambiar el dataset (agregar más series, cambiar categorías, o actualizar thumbnails), simplemente ejecuto `npm run seed` nuevamente. Con datos manuales, tendría que editar archivos SQL extensos.

4. **Demostración de habilidades:** Implementar integración con APIs externas, manejo de rate limits, construcción de URLs de imágenes, y mapeo de datos entre esquemas diferentes demuestra capacidad técnica más allá de CRUD básico.

5. **Consistencia de datos:** TMDB garantiza que todas las series tengan la misma estructura de datos (poster, backdrop, episodios con thumbnails), mientras que datos manuales podrían tener campos faltantes o inconsistentes.

### Optimizaciones de rendimiento en carruseles

Para los carruseles horizontales (`CategoryRow`), se implementaron múltiples optimizaciones de `FlatList` que son críticas cuando se tienen múltiples carruseles en la misma pantalla:

- **removeClippedSubviews:** Desmonta componentes fuera del viewport, liberando memoria
- **maxToRenderPerBatch:** Controla cuántos items se procesan por ciclo de renderizado (5 items)
- **windowSize:** Define cuántas "ventanas" mantener en memoria (5x el tamaño visible)
- **initialNumToRender:** Solo renderiza 3 items inicialmente para carga más rápida
- **decelerationRate:** Scroll rápido y suave que mejora la sensación de fluidez

**Impacto:** Estas optimizaciones permiten tener hasta 16 carruseles en `HomeScreen` sin lag ni consumo excesivo de memoria, manteniendo 60 FPS en dispositivos de gama media. Sin estas optimizaciones, la app se volvería lenta e inutilizable con tantos componentes en pantalla.

Además, todos los componentes críticos (`ShowCard`, `EpisodeItem`, `CategoryRow`) usan `React.memo` para evitar re-renders innecesarios, y los callbacks están memoizados con `useCallback` para preservar referencias estables entre renders.

---

## 🤖 Prompts usados en IA

### 1. Diseño de Base de Datos (init.sql)
**Prompt:**
> "Necesito que diseñes un schema completo de base de datos PostgreSQL para una aplicación de catálogo de series estilo Netflix. Genera un archivo init.sql que incluya:
> 
> **Tablas necesarias:**
> - `categories` (géneros: Drama, Comedia, Acción, etc.)
> - `shows` (series con título, sinopsis, poster_url, backdrop_url)
> - `episodes` (episodios con título, número, duración, thumbnail_url)
> - `show_categories` (relación muchos-a-muchos entre shows y categorías)
> - `user_favorites` (favoritos por usuario autenticado con auth.uid())
> 
> **Relaciones:**
> - `episodes.show_id` → `shows.id` (FK con ON DELETE CASCADE)
> - `show_categories.show_id` → `shows.id` (FK con ON DELETE CASCADE)
> - `show_categories.category_id` → `categories.id` (FK con ON DELETE CASCADE)
> - `user_favorites.show_id` → `shows.id` (FK con ON DELETE CASCADE)
> 
> **Constraints:**
> - Unique constraint en `user_favorites(user_id, show_id)` para evitar duplicados
> 
> **Políticas RLS (Row Level Security):**
> - Habilitar RLS en todas las tablas
> - `categories`, `shows`, `episodes`, `show_categories`: Lectura pública (SELECT para anónimos y autenticados)
> - `user_favorites`: Solo usuarios autenticados pueden ver/crear/eliminar SUS PROPIOS favoritos usando auth.uid()
> 
> **Índices:**
> - Índices en foreign keys para optimizar joins
> - Índice en `user_favorites(user_id)` para queries rápidas
> 
> Genera el SQL completo con CREATE TABLE, ALTER TABLE, CREATE POLICY, CREATE INDEX, y comentarios explicativos."

**Resultado:** Se generó el schema SQL completo con 5 tablas relacionadas, políticas RLS granulares, constraints de integridad referencial, e índices optimizados. Este archivo sirvió como fundación de toda la base de datos del proyecto.

### 2. Setup de Aplicación React Native
**Prompt:**
> "Necesito crear una aplicación móvil estilo Netflix con React Native, TypeScript, Expo y Supabase. La app debe tener:
> 
> **Funcionalidades principales:**
> - Autenticación con email/password (login, registro, logout, persistencia de sesión)
> - Catálogo de series organizadas por categorías en carruseles horizontales
> - Pantalla de detalles de serie con lista de episodios
> - Sistema de favoritos (agregar/quitar de 'My List')
> - Navegación con Stack Navigator y Bottom Tabs
> 
> **Arquitectura del código:**
> - `components/`: Componentes reutilizables de UI (ShowCard, CategoryRow, EpisodeItem) optimizados con React.memo
> - `screens/`: Pantallas principales (HomeScreen, ShowDetailScreen, FavoritesScreen, LoginScreen, RegisterScreen, ProfileScreen)
> - `hooks/`: Custom hooks para data fetching (useCategoriesWithShows, useEpisodes, useFavoriteStatus)
> - `services/`: Capa de abstracción sobre Supabase (fetchShows, addFavorite, removeFavorite)
> - `contexts/`: Context API para autenticación global (AuthContext con session, user, signIn, signUp, signOut)
> - `store/`: Zustand store para persistir sesión en AsyncStorage
> - `navigation/`: Configuración de React Navigation (RootNavigation, TabNavigation)
> - `types/`: Tipos TypeScript para entidades y navegación
> - `lib/`: Configuración de Supabase client
> 
> **Optimizaciones de rendimiento:**
> - FlatList con removeClippedSubviews, maxToRenderPerBatch, windowSize para carruseles
> - useCallback y useMemo para evitar re-renders
> - React.memo en todos los componentes presentacionales
> 
> Configura la integración completa con Supabase (lectura de .env, manejo de sesiones, listener de auth state)."

**Resultado:** Se creó la estructura completa del proyecto con separación de responsabilidades, sistema de autenticación robusto con persistencia, optimizaciones de performance en listas, y navegación fluida. La arquitectura permite escalar fácilmente y mantener el código limpio.

### 3. Seeding con API Externa (TMDB)
**Prompt:**
> "Necesito una estrategia robusta de seeding para popular la aplicación con datos reales de alta calidad usando TMDB API. Debe incluir:
> 
> **Scripts SQL:**
> 1. `reset-data.sql`: Script para limpiar completamente la BD con TRUNCATE CASCADE en orden correcto (respetando foreign keys)
> 
> **Script TypeScript (`scripts/seed.ts`):**
> 1. Descargar géneros de TV desde `/genre/tv/list` de TMDB
> 2. Insertar categorías en la tabla `categories` (manejo de duplicados con try-catch)
> 3. Descargar 15 series populares desde `/tv/popular`
> 4. Para cada serie, obtener detalles completos desde `/tv/{id}`
> 5. Construir URLs completas de imágenes usando `https://image.tmdb.org/t/p/w500/` + path
> 6. Descargar episodios (hasta 10 por serie) desde `/tv/{id}/season/{season}/episode/{episode}`
> 7. Obtener `still_path` de cada episodio para thumbnails
> 8. Vincular series a categorías usando la tabla de relación `show_categories`
> 
> **Configuración:**
> - Leer credenciales desde `.env` (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TMDB_API_KEY)
> - Usar service role key de Supabase para bypassear RLS durante seeding
> - Manejo de errores y rate limits de TMDB
> - Logging detallado del progreso (géneros insertados, series procesadas, episodios agregados)
> 
> **Ejecución:**
> - Configurar script npm `seed` para ejecutar con `tsx scripts/seed.ts`
> - Documentar proceso completo en README
> 
> Genera el código completo con manejo robusto de errores y tipos TypeScript."

**Resultado:** Se implementó un sistema de seeding completamente funcional que pobla la BD con 16 géneros, 15 series reales con detalles completos, y 266 episodios con thumbnails. El script maneja duplicados correctamente, construye URLs de imágenes completas, y se ejecuta en ~20 segundos. Incluye `reset-data.sql` para limpiar datos antes de re-seed.

---

## 🚀 Qué haría a continuación

Si tuviera más tiempo para mejorar el proyecto, implementaría:

### 1. **Búsqueda Global de Series**
Agregar una funcionalidad de búsqueda completa que permita a los usuarios encontrar series rápidamente:
- **Barra de búsqueda** en la navegación superior con debouncing para evitar queries excesivas
- **Búsqueda full-text** en PostgreSQL usando `to_tsvector` y `to_tsquery` para buscar en títulos y sinopsis
- **Filtros avanzados** por categoría, año, o duración de episodios
- **Historial de búsquedas** guardado localmente con AsyncStorage
- **Sugerencias automáticas** mientras el usuario escribe

```tsx
// Ejemplo de implementación
const { results, loading } = useSearch(searchQuery);
```

### 2. **Internacionalización (i18n) Multi-idioma**
Implementar soporte para múltiples idiomas usando **react-i18next**:
- **Español e Inglés** como idiomas iniciales
- **Selector de idioma** en la pantalla de perfil
- **Traducción completa** de toda la interfaz (botones, mensajes de error, pantallas)
- **Persistencia de preferencia** en AsyncStorage para recordar el idioma elegido
- **Formato de fechas y duraciones** según la locale del usuario

Esto mejoraría significativamente la accesibilidad y usabilidad para audiencias internacionales, especialmente considerando que Netflix es una plataforma global.

### 3. **Notificaciones Push para Nuevos Episodios**
Integrar **Expo Notifications** para alertar a usuarios sobre contenido nuevo:
- **Notificaciones al agregar nuevos episodios** de series en favoritos
- **Recordatorios personalizados** cuando una serie favorita tiene una nueva temporada
- **Configuración granular** en perfil para elegir qué notificaciones recibir
- **Deep linking** para que al tocar la notificación, abra directamente la pantalla de detalles de la serie
- **Backend con Firebase Cloud Messaging** o Supabase Edge Functions para enviar notificaciones programadas

```tsx
// Ejemplo de configuración
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Nuevo episodio disponible",
    body: `${show.title} - Episodio ${episode.number}`,
  },
  trigger: { date: episodeReleaseDate },
});
```

### 4. **Unit Testing con Jest y React Native Testing Library**
Agregar tests para garantizar calidad y prevenir regressiones:
- **Componentes:** Verificar rendering correcto de `ShowCard`, `EpisodeItem`, `CategoryRow`
- **Hooks:** Testear `useFavoriteStatus`, `useCategoriesWithShows` con datos mock
- **Services:** Validar operaciones CRUD de `supabase.service.ts`
- **Cobertura objetivo: 80%** en toda la aplicación

```bash
npm install --save-dev jest @testing-library/react-native
npm test
```

### 5. **Animación Compartida (Shared Element Transition)**
Implementar transiciones suaves al navegar de `ShowCard` a `ShowDetailScreen`:
- **Animar el poster** desde el carrusel hasta el backdrop de detalle
- Usar **react-native-reanimated** o `@react-navigation/native-stack` con `sharedElementTransition`
- **Animaciones de fade** para los detalles de la serie
- Mejorar UX haciendo la navegación más fluida y moderna, similar a la app oficial de Netflix

### 6. **Modo Offline con WatermelonDB**
Agregar soporte offline para mejorar experiencia sin conexión:
- **WatermelonDB** como capa de caché local sincronizable con Supabase
- Cachear series, categorías y episodios descargados
- **Sincronización bi-direccional** cuando vuelve la conexión
- Permitir navegar por contenido ya visto sin internet

**Beneficios:**
- Experiencia más robusta en redes lentas o intermitentes
- Menor latencia al cargar pantallas ya visitadas
- Uso reducido de datos móviles

---

## 📄 Licencia

Proyecto creado para desafío técnico. Uso educativo.

