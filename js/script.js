class Memorama {
  constructor() {
    this.totalTarjetas = [];
    this.numeroTarjetas = 0;
    this.verificaTarjetas = [];
    this.errores = 0;
    this.dificultad = "";
    this.tarjetasCorrectas = [];
    this.numeroIntentos = 0;
    this.agregarTarjetas = [];
    this.numeroPares = 0;
    this.juegoActivo = false; // Evitar clics durante animaciones

    // HTML
    this.$contenedorTarjetas = document.querySelector(".contenedor-tarjetas");
    this.$contenedorGeneral = document.querySelector(".contenedor-general");
    this.$mensaje = document.querySelector(".mensaje");
    this.$pantallaBloqueada = document.querySelector(".pantalla-bloqueada");
    this.$errorcontenedor = document.createElement("div");
    this.$nivelDificultad = document.createElement("div");

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
        if (seleccion === "Facil") {
          this.numeroIntentos = 7;
          this.dificultad = "Fácil";
          this.tiempoMostrarCartas = 3000;
          this.numeroPares = 4;
        } else if (seleccion === "Dificil") {
          this.numeroIntentos = 5;
          this.dificultad = "Difícil";
          this.tiempoMostrarCartas = 2000;
          this.numeroPares = 8; 
        } else {
          this.numeroIntentos = 5;
          this.dificultad = "Intermedio";
          this.tiempoMostrarCartas = 2000;
          this.numeroPares = 6;
        }

        modal.style.display = "none";
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
    }, this.tiempoMostrarCartas);
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
        // Error
        this.reversoTarjetas(this.agregarTarjetas);
        this.errores++;
        this.actualizarErrores();
        this.derrotaJuego();
      }

      // Limpiar arrays
      this.verificaTarjetas = [];
      this.agregarTarjetas = [];
    }
  }

  victoriaJuego() {
    if (this.tarjetasCorrectas.length === this.numeroTarjetas) {
      this.juegoActivo = false;

      setTimeout(() => {
        this.$pantallaBloqueada.style.display = "flex";
        this.$mensaje.innerText = "🎉 ¡Felicidades, has ganado! 🎉";
      }, 1000);

      setTimeout(() => {
        location.reload();
      }, 4000);
    }
  }

  actualizarErrores() {
    this.$errorcontenedor.innerText = `Errores: ${this.errores}/${this.numeroIntentos}`;
  }

  derrotaJuego() {
    if (this.errores >= this.numeroIntentos) {
      this.juegoActivo = false;

      setTimeout(() => {
        this.$pantallaBloqueada.style.display = "flex";
        this.$mensaje.innerText = "😔 ¡Has perdido! Inténtalo de nuevo 😔";
      }, 1000);

      setTimeout(() => {
        location.reload();
      }, 4000);
    }
  }

  crearPanelInfo() {
    // Crear panel de información usando el CSS mejorado
    const panelInfo = document.createElement("div");
    panelInfo.classList.add("info-panel");

    this.$errorcontenedor.classList.add("error");
    this.$nivelDificultad.classList.add("nivel-dificultad");

    this.actualizarErrores();
    this.$nivelDificultad.innerHTML = `${this.dificultad} - ${this.numeroPares} pares`;

    panelInfo.appendChild(this.$errorcontenedor);
    panelInfo.appendChild(this.$nivelDificultad);

    this.$contenedorGeneral.appendChild(panelInfo);
  }
}

new Memorama();