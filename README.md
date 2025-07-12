# Web-WorkFlow - Plataforma de Recursos Humanos

## Estructura del Proyecto

El proyecto ha sido reorganizado para una mejor organización de archivos:

### 📁 Estructura de Carpetas

```
Web-WorkFlow/
├── index.html                 # Página principal (mantenida en raíz)
├── css/                       # Todos los archivos CSS
│   ├── style.css             # Estilos principales
│   ├── profile.css           # Estilos del perfil
│   ├── jobs.css              # Estilos de empleos
│   ├── company-dashboard.css # Estilos del panel de empresa
│   ├── post-job.css          # Estilos para publicar empleos
│   └── ...                   # Otros archivos CSS
├── js/                        # Todos los archivos JavaScript
│   ├── main.js               # JavaScript principal
│   ├── auth.js               # Autenticación
│   ├── profile.js            # Funcionalidad del perfil
│   ├── jobs.js               # Funcionalidad de empleos
│   └── ...                   # Otros archivos JS
├── html/                      # Todas las páginas HTML (excepto index.html)
│   ├── profile.html          # Página de perfil
│   ├── jobs.html             # Página de empleos
│   ├── company-dashboard.html # Panel de empresa
│   ├── post-job.html         # Publicar empleo
│   └── ...                   # Otras páginas HTML
├── img/                       # Imágenes del proyecto
│   └── Logo-WorkFlow.jpg     # Logo principal
├── backend/                   # Archivos PHP del backend
└── public/                    # Archivos públicos
```

### 🔗 Rutas Actualizadas

Todas las rutas han sido actualizadas para reflejar la nueva estructura:

#### Desde archivos HTML en la carpeta `html/`:
- **CSS**: `../css/archivo.css`
- **JS**: `../js/archivo.js`
- **Imágenes**: `../img/archivo.jpg`
- **Index**: `../index.html`

#### Desde `index.html` (en raíz):
- **CSS**: `css/archivo.css`
- **JS**: `js/archivo.js`
- **Imágenes**: `img/archivo.jpg`

### 📋 Archivos Reorganizados

#### Archivos CSS (12 archivos):
- `style.css` - Estilos principales
- `profile.css` - Perfil de usuario
- `jobs.css` - Página de empleos
- `company-dashboard.css` - Panel de empresa
- `post-job.css` - Publicar empleos
- `search.css` - Búsqueda
- `filtrar-postulantes.css` - Filtrar postulantes
- `gestionar-postulantes.css` - Gestionar postulantes
- `gestionar-vacantes.css` - Gestionar vacantes
- `realizar-test.css` - Tests de habilidades
- `resultados-tests.css` - Resultados de tests
- `asignar-test.css` - Asignar tests

#### Archivos JavaScript (16 archivos):
- `main.js` - JavaScript principal
- `auth.js` - Autenticación
- `profile.js` - Perfil de usuario
- `jobs.js` - Funcionalidad de empleos
- `company-dashboard.js` - Panel de empresa
- `post-job.js` - Publicar empleos
- `search.js` - Búsqueda
- `filtrar-postulantes.js` - Filtrar postulantes
- `gestionar-postulantes.js` - Gestionar postulantes
- `gestionar-vacantes.js` - Gestionar vacantes
- `realizar-test-logica.js` - Test de lógica
- `realizar-test-matematicas.js` - Test de matemáticas
- `realizar-test-programacion.js` - Test de programación
- `resultados-tests.js` - Resultados de tests
- `resultados-postulantes.js` - Resultados de postulantes
- `asignar-test.js` - Asignar tests

#### Archivos HTML (17 archivos):
- `profile.html` - Perfil de usuario
- `jobs.html` - Página de empleos
- `company-dashboard.html` - Panel de empresa
- `post-job.html` - Publicar empleos
- `search.html` - Búsqueda
- `filtrar-postulantes.html` - Filtrar postulantes
- `gestionar-postulantes.html` - Gestionar postulantes
- `gestionar-vacantes.html` - Gestionar vacantes
- `realizar-test-logica.html` - Test de lógica
- `realizar-test-matematicas.html` - Test de matemáticas
- `realizar-test-programacion.html` - Test de programación
- `resultados-tests.html` - Resultados de tests
- `resultados-logica.html` - Resultados de lógica
- `resultados-matematicas.html` - Resultados de matemáticas
- `resultados-programacion.html` - Resultados de programación
- `resultados-postulantes.html` - Resultados de postulantes
- `asignar-test.html` - Asignar tests
- `recover-password.html` - Recuperar contraseña

### ✅ Beneficios de la Reorganización

1. **Mejor Organización**: Archivos agrupados por tipo
2. **Mantenimiento Más Fácil**: Encontrar archivos específicos es más sencillo
3. **Escalabilidad**: Fácil agregar nuevos archivos en las carpetas correspondientes
4. **Claridad**: Estructura más clara y profesional

### 🚀 Cómo Usar

1. Abre `index.html` en tu navegador para acceder a la página principal
2. Todas las rutas están configuradas correctamente para la nueva estructura
3. Los archivos del backend permanecen en la carpeta `backend/`
4. Las imágenes permanecen en la carpeta `img/` 