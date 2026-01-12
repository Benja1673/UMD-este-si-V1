# 1. Usamos una versión ligera de Node 20
FROM node:20-alpine

# 2. Carpeta de trabajo dentro de Docker
WORKDIR /app

# 3. Copiamos los archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# 4. Instalamos las dependencias
RUN npm install

# 5. Generamos Prisma (vital para que funcione la DB)
RUN npx prisma generate

# 6. Copiamos el resto del código
COPY . .

# 7. Construimos la app para producción
RUN npm run build

# 8. Abrimos el puerto interno
EXPOSE 3000

# 9. Comando de inicio
CMD ["npm", "start"]