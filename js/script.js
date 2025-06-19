class Memorama {
  constructor() {
    this.totalTarjetas = [];
    this.numeroTarjetas = 0;
    this.verificaTarjetas = [];
    this.dificultad = "";
    this.tarjetasCorrectas = [];
    this.agregarTarjetas = [];
    this.numeroPares = 0;
    this.juegoActivo = false; // Evitar clics durante animaciones
    this.tiempoTotal = 60; // segundos
    this.tiempoRestante = this.tiempoTotal;
    this.intervaloTiempo = null;

    // HTML
    this.$contenedorTarjetas = document.querySelector(".contenedor-tarjetas");
    this.$contenedor2 = document.querySelector(".contenedor-2");
    this.$mensaje = document.querySelector(".mensaje");
    this.$pantallaBloqueada = document.querySelector(".pantalla-bloqueada");
    this.$nivelDificultad = document.createElement("div");
    this.$tiempoRestante = null;
    this.$panelInfo = null; // Referencia al panel completo

    this.eventos();
  }

  eventos() {
    window.addEventListener("DOMContentLoaded", () => {
      this.seleccionDificultad();
      window.addEventListener(
        "contextmenu",
        (e) => {
          e.preventDefault();
        },
        false
      );
    });
  }

  seleccionDificultad() {
    const modal = document.getElementById("modal-dificultad");
    const botones = document.querySelectorAll(".btn-dificultad");

    modal.style.display = "flex";

    botones.forEach((btn) => {
      btn.addEventListener("click", () => {
        const seleccion = btn.dataset.dificultad;

        this.tiempoTotal = 60;
        this.tiempoRestante = this.tiempoTotal;

        if (seleccion === "Facil") {
          this.dificultad = "Fácil";
          this.tiempoMostrarCartas = 2000;
          this.numeroPares = 4;
          this.tiempoTotal = 60;

        } else if (seleccion === "Dificil") {
          this.dificultad = "Difícil";
          this.tiempoMostrarCartas = 1500;
          this.numeroPares = 6;
          this.tiempoTotal = 35;
        } else {
          this.dificultad = "Intermedio";
          this.tiempoMostrarCartas = 2000;
          this.numeroPares = 6;
          this.tiempoTotal = 50;
        }

        this.tiempoRestante = this.tiempoTotal;

        modal.style.display = "none";
        this.crearTemporizadorPrincipal();
        this.crearPanelInfo();
        this.cargarRespuestas();
      });
    });
  }

  async cargarRespuestas() {
    try {
      const respuesta = await fetch("../memo.json");
      const data = await respuesta.json();

      // Evitar duplicados al seleccionar
      const imagenesUnicas = Array.from(new Set(data.map(img => img.src)))
        .map(src => data.find(img => img.src === src));

      // Verificar si hay suficientes imágenes únicas
      if (imagenesUnicas.length < this.numeroPares) {
        alert(`No hay suficientes imágenes únicas para esta dificultad. Se necesitan ${this.numeroPares} imágenes únicas.`);
        return;
      }

      // Elegir N imágenes aleatorias sin repetir
      const seleccionadas = imagenesUnicas
        .sort(() => Math.random() - 0.5)
        .slice(0, this.numeroPares);

      // Crear los pares
      const pares = [...seleccionadas, ...seleccionadas];

      // Mezclar todas las cartas (los pares)
      this.totalTarjetas = pares.sort(() => Math.random() - 0.5);
      this.numeroTarjetas = this.totalTarjetas.length;

      // Mostrar en HTML
      let html = "";
      this.totalTarjetas.forEach((card, index) => {
        html += `<div class="tarjeta" data-index="${index}"><img class="tarjeta-img" src="${card.src}" alt="imagen ${index}"></div>`;
      });
      this.$contenedorTarjetas.innerHTML = html;

      // Mostrar brevemente las cartas
      this.mostrarCartasIniciales();

    } catch (error) {
      console.error("Error al cargar las cartas:", error);
      alert("Error al cargar el juego. Por favor, recarga la página.");
    }
  }

  mostrarCartasIniciales() {
    const imagenes = document.querySelectorAll(".tarjeta-img");
    const tarjetas = document.querySelectorAll(".tarjeta");

    // Mostrar todas las cartas
    imagenes.forEach((img) => {
      img.style.display = "block";
    });

    tarjetas.forEach((tarjeta) => {
      tarjeta.style.backgroundImage = "none";
      tarjeta.style.backgroundColor = "white";
    });

    // Ocultar después del tiempo establecido
    setTimeout(() => {
      imagenes.forEach((img) => {
        img.style.display = "none";
      });

      tarjetas.forEach((tarjeta) => {
        tarjeta.style.backgroundImage = "url(../img/cover.jpg)";
        tarjeta.style.backgroundColor = "";
      });

      this.juegoActivo = true;
      this.comienzaJuego();
      this.iniciarTemporizador();

    }, this.tiempoMostrarCartas);
  }

  crearTemporizadorPrincipal() {
    // Crear el elemento del temporizador con mejor diseño
    this.$tiempoRestante = document.createElement("div");
    this.$tiempoRestante.classList.add("temporizador-principal");

    // Crear estructura interna del temporizador
    this.$tiempoRestante.innerHTML = `
      <div class="temporizador-icono">⏰</div>
      <div class="temporizador-tiempo">${this.tiempoRestante}s</div>
    `;
  }

  iniciarTemporizador() {
    // Asegurar que el elemento existe antes de iniciar el temporizador
    if (!this.$tiempoRestante) {
      console.error("Elemento de tiempo no encontrado");
      return;
    }

    // Actualizar la visualización inicial
    this.actualizarVisualizacionTiempo();

    this.intervaloTiempo = setInterval(() => {
      this.tiempoRestante--;
      this.actualizarVisualizacionTiempo();

      // Aplicar efectos visuales según el tiempo restante
      this.aplicarEfectosTiempo();

      if (this.tiempoRestante <= 0) {
        clearInterval(this.intervaloTiempo);
        this.juegoActivo = false;
        this.$pantallaBloqueada.style.display = "flex";
        this.$mensaje.innerText = "⏰ ¡Se acabó el tiempo! Inténtalo de nuevo.";
        setTimeout(() => location.reload(), 4000);
      }
    }, 1000);
  }

  actualizarVisualizacionTiempo() {
    const tiempoElemento = this.$tiempoRestante.querySelector('.temporizador-tiempo');
    if (tiempoElemento) {
      tiempoElemento.textContent = `${this.tiempoRestante}s`;
    }
  }

  aplicarEfectosTiempo() {
    // Remover clases previas
    this.$panelInfo.classList.remove('panel-critico', 'panel-advertencia', 'panel-normal');
    this.$tiempoRestante.classList.remove('tiempo-critico', 'tiempo-advertencia', 'tiempo-normal');

    if (this.tiempoRestante <= 10) {
      // Tiempo crítico - panel y temporizador con animación de pulso roja
      this.$panelInfo.classList.add('panel-critico');
      this.$tiempoRestante.classList.add('tiempo-critico');
    } else if (this.tiempoRestante <= 20) {
      // Tiempo de advertencia - panel y temporizador con color naranja
      this.$panelInfo.classList.add('panel-advertencia');
      this.$tiempoRestante.classList.add('tiempo-advertencia');
    } else {
      // Tiempo normal - estado por defecto
      this.$panelInfo.classList.add('panel-normal');
      this.$tiempoRestante.classList.add('tiempo-normal');
    }
  }

  comienzaJuego() {
    const tarjetas = document.querySelectorAll(".tarjeta");
    tarjetas.forEach((tarjeta) => {
      tarjeta.addEventListener("click", (e) => {
        this.clickTarjeta(e);
      });
    });
  }

  clickTarjeta(e) {
    // Verificar si el juego está activo y si no hay ya 2 cartas volteadas
    if (!this.juegoActivo || this.verificaTarjetas.length >= 2) {
      return;
    }

    const tarjeta = e.currentTarget;

    // Evitar clic en cartas ya acertadas o ya volteadas
    if (tarjeta.classList.contains("acertada") ||
      tarjeta.childNodes[0].style.display === "block") {
      return;
    }

    this.voltearTarjetas(tarjeta);

    const sourceImage = tarjeta.querySelector('.tarjeta-img').src;
    this.verificaTarjetas.push(sourceImage);
    this.agregarTarjetas.push(tarjeta);

    this.compararTarjetas();
  }

  voltearTarjetas(tarjeta) {
    tarjeta.style.backgroundImage = "none";
    tarjeta.style.backgroundColor = "white";
    tarjeta.querySelector('.tarjeta-img').style.display = "block";
  }

  fijarAcertado(arrTarjetasAcertadas) {
    arrTarjetasAcertadas.forEach((tarjeta) => {
      tarjeta.classList.add("acertada", "animacion-correcto");

      setTimeout(() => {
        tarjeta.classList.remove("animacion-correcto");
      }, 800);

      this.tarjetasCorrectas.push(tarjeta);
    });

    // Verificar victoria después de un pequeño delay
    setTimeout(() => {
      this.victoriaJuego();
    }, 500);
  }

  reversoTarjetas(arrTarjetas) {
    this.juegoActivo = false; // Bloquear clics durante la animación

    arrTarjetas.forEach((tarjeta) => {
      tarjeta.classList.add("animacion-incorrecto");

      setTimeout(() => {
        tarjeta.classList.remove("animacion-incorrecto");
        tarjeta.style.backgroundImage = "url(../img/cover.jpg)";
        tarjeta.style.backgroundColor = "";
        tarjeta.querySelector('.tarjeta-img').style.display = "none";
      }, 600);
    });

    // Reactivar el juego después de la animación
    setTimeout(() => {
      this.juegoActivo = true;
    }, 1000);
  }

  compararTarjetas() {
    if (this.verificaTarjetas.length === 2) {
      if (this.verificaTarjetas[0] === this.verificaTarjetas[1]) {
        // Acierto
        this.fijarAcertado(this.agregarTarjetas);
      } else {
        // Error - ya no se cuenta como derrota, solo se voltean las cartas
        this.reversoTarjetas(this.agregarTarjetas);
      }

      // Limpiar arrays
      this.verificaTarjetas = [];
      this.agregarTarjetas = [];
    }
  }

  victoriaJuego() {
    if (this.tarjetasCorrectas.length === this.numeroTarjetas) {
      this.juegoActivo = false;
      clearInterval(this.intervaloTiempo);

      // Efecto de celebración en el panel
      this.$panelInfo.classList.add('panel-victoria');

      setTimeout(() => {
        this.$pantallaBloqueada.style.display = "flex";
        this.$mensaje.innerText = "🎉 ¡Felicidades, has ganado! 🎉";
      }, 1000);

      setTimeout(() => {
        location.reload();
      }, 4000);
    }
  }

  crearPanelInfo() {
    // Crear panel de información mejorado
    this.$panelInfo = document.createElement("div");
    this.$panelInfo.classList.add("info-panel", "panel-normal");

    // Agregar el temporizador al panel
    this.$panelInfo.appendChild(this.$tiempoRestante);

    // Crear información de dificultad simplificada (sin ícono circular)
    this.$nivelDificultad.classList.add("nivel-dificultad");

    this.$nivelDificultad.innerHTML = `
      <div class="dificultad-info">
        <div class="dificultad-nivel">${this.dificultad}</div>
        <div class="dificultad-pares">${this.numeroPares} pares</div>
      </div>
    `;

    this.$panelInfo.appendChild(this.$nivelDificultad);
    this.$contenedor2.appendChild(this.$panelInfo);
  }
}

new Memorama();