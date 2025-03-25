'use strict';

const brandDataKey = 'brandData';
const brandData = window.sessionStorage.getItem(brandDataKey);

const title = document.getElementById('title');
const icon = document.getElementById('icon');
const appleTouchIcon = document.getElementById('appleTouchIcon');
const newRoomTitle = document.getElementById('newRoomTitle');
const newRoomDescription = document.getElementById('newRoomDescription');

const description = document.getElementById('description');
const keywords = document.getElementById('keywords');

const appTitle = document.getElementById('appTitle');
const appDescription = document.getElementById('appDescription');
const joinDescription = document.getElementById('joinDescription');
const joinRoomBtn = document.getElementById('joinRoomButton');
const joinLastLabel = document.getElementById('joinLastLabel');

const features = document.getElementById('features');
const teams = document.getElementById('teams');
const tryEasier = document.getElementById('tryEasier');
const poweredBy = document.getElementById('poweredBy');
const sponsors = document.getElementById('sponsors');
const advertisers = document.getElementById('advertisers');
const footer = document.getElementById('footer');
//...

// app/src/config.js - ui.brand
let BRAND = {
    app: {
        language: 'pt-br',
        name: 'Attimo Conference',
        title: 'Attimo Conference<br />Chamadas de vídeo em tempo real gratuitas no navegador.<br />Simples, Seguro, Rápido.',
        description:
            'Inicie sua próxima videochamada com um único clique. Sem download, plug-in ou login necessário. Vá direto para conversar, enviar mensagens e compartilhar sua tela.',
        joinDescription: 'Escolha um nome para a sala.<br />Que tal este?',
        joinButtonLabel: 'ENTRAR NA SALA',
        joinLastLabel: 'Sua sala recente:',
    },
    site: {
        title: 'Attimo Conference, Chamadas de Vídeo Gratuitas, Mensagens e Compartilhamento de Tela',
        icon: '../images/logo5_alta_small.png',
        appleTouchIcon: '../images/logo5_alta_small.png',
        newRoomTitle: 'Escolha um nome. <br />Compartilhe a URL. <br />Inicie a conferência.',
        newRoomDescription:
            'Cada sala tem sua URL descartável. Basta escolher um nome para a sala e compartilhar sua URL personalizada. É simples assim.',
    },
    meta: {
        description:
            'Attimo Conference desenvolvido com WebRTC e mediasoup, chamadas de vídeo em tempo real Simples, Seguras e Rápidas, mensagens e capacidades de compartilhamento de tela no navegador.',
        keywords:
            'webrtc, attimo, mediasoup, mediasoup-client, self hosted, voip, sip, comunicações em tempo real, chat, mensagens, meet, webrtc stun, webrtc turn, webrtc p2p, webrtc sfu, reunião por vídeo, chat por vídeo, videoconferência, chat com múltiplos vídeos, conferência com múltiplos vídeos, peer to peer, p2p, sfu, rtc, alternativa a, zoom, microsoft teams, google meet, jitsi, reunião',
    },
    html: {
        features: true,
        teams: true,
        tryEasier: true,
        poweredBy: true,
        sponsors: true,
        advertisers: true,
        footer: true,
    },
    about: {
        imageUrl: '../images/mirotalk-logo.gif',
        title: '<strong>WebRTC SFU v1.7.86</strong>',
        html: `
            <button 
                id="support-button" 
                data-umami-event="Support button" 
                onclick="window.open('https://codecanyon.net/user/miroslavpejic85', '_blank')">
                <i class="fas fa-heart"></i> Apoiar
            </button>
            <br /><br /><br />
            Autor: 
            <a 
                id="linkedin-button" 
                data-umami-event="Linkedin button" 
                href="https://www.linkedin.com/in/miroslav-pejic-976a07101/" 
                target="_blank"> 
                Miroslav Pejic
            </a>
            <br /><br />
            Email: 
            <a 
                id="email-button" 
                data-umami-event="Email button" 
                href="mailto:miroslav.pejic.85@gmail.com?subject=Attimo Conference info"> 
                miroslav.pejic.85@gmail.com
            </a>
            <br /><br />
            <hr />
            <span>&copy; 2025 Attimo Conference, todos os direitos reservados</span>
            <hr />
        `,
    },
    //...
};

async function initialize() {
    await getBrand();

    customizeSite();

    customizeMetaTags();

    customizeApp();

    checkBrand();
}

async function getBrand() {
    if (brandData) {
        setBrand(JSON.parse(brandData));
    } else {
        try {
            const response = await fetch('/brand', { timeout: 5000 });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const serverBrand = data.message;
            if (serverBrand) {
                setBrand(serverBrand);
                console.log('FETCH BRAND SETTINGS', {
                    serverBrand: serverBrand,
                    clientBrand: BRAND,
                });
                window.sessionStorage.setItem(brandDataKey, JSON.stringify(serverBrand));
            }
        } catch (error) {
            console.error('FETCH GET BRAND ERROR', error.message);
        }
    }
}

// BRAND configurations
function setBrand(data) {
    BRAND = data;
    console.log('Set Brand done');
}

// BRAND check
function checkBrand() {
    !BRAND.html.features && elementDisplay(features, false);
    !BRAND.html.teams && elementDisplay(teams, false);
    !BRAND.html.tryEasier && elementDisplay(tryEasier, false);
    !BRAND.html.poweredBy && elementDisplay(poweredBy, false);
    !BRAND.html.sponsors && elementDisplay(sponsors, false);
    !BRAND.html.advertisers && elementDisplay(advertisers, false);
    !BRAND.html.footer && elementDisplay(footer, false);
}

// ELEMENT display mode
function elementDisplay(element, display, mode = 'block') {
    if (!element) return;
    element.style.display = display ? mode : 'none';
}

// APP customize
function customizeApp() {
    if (appTitle && BRAND.app?.title) {
        appTitle.innerHTML = BRAND.app?.title;
    }
    if (appDescription && BRAND.app?.description) {
        appDescription.textContent = BRAND.app.description;
    }
    if (joinDescription && BRAND.app?.joinDescription) {
        joinDescription.innerHTML = BRAND.app.joinDescription;
    }
    if (joinRoomBtn && BRAND.app?.joinButtonLabel) {
        joinRoomBtn.innerText = BRAND.app.joinButtonLabel;
    }
    if (joinLastLabel && BRAND.app?.joinLastLabel) {
        joinLastLabel.innerText = BRAND.app.joinLastLabel;
    }
}

// SITE metadata
function customizeSite() {
    if (title && BRAND.site?.title) {
        title.textContent = BRAND.site?.title;
    }
    if (icon && BRAND.site?.icon) {
        icon.href = BRAND.site?.icon;
    }
    if (appleTouchIcon && BRAND.site?.appleTouchIcon) {
        appleTouchIcon.href = BRAND.site.appleTouchIcon;
    }
    if (newRoomTitle && BRAND.site?.newRoomTitle) {
        newRoomTitle.innerHTML = BRAND.site?.newRoomTitle;
    }
    if (newRoomDescription && BRAND.site?.newRoomDescription) {
        newRoomDescription.textContent = BRAND.site.newRoomDescription;
    }
}

// SEO metadata
function customizeMetaTags() {
    if (description && BRAND.meta?.description) {
        description.content = BRAND.meta.description;
    }
    if (keywords && BRAND.meta?.keywords) {
        keywords.content = BRAND.meta.keywords;
    }
}

initialize();
