'use strict';

const packageJson = require('../../package.json');

const os = require('os');

// #############################
// HELPERS
// #############################

const platform = os.platform();

function getFFmpegPath(platform) {
    switch (platform) {
        case 'darwin':
            return '/usr/local/bin/ffmpeg'; // macOS
        case 'linux':
            return '/usr/bin/ffmpeg'; // Linux
        case 'win32':
            return 'C:\\ffmpeg\\bin\\ffmpeg.exe'; // Windows
        default:
            return '/usr/bin/ffmpeg'; // Centos or others...
    }
}

// https://api.ipify.org

function getIPv4() {
    const ifaces = os.networkInterfaces();
    for (const interfaceName in ifaces) {
        const iface = ifaces[interfaceName];
        for (const { address, family, internal } of iface) {
            if (family === 'IPv4' && !internal) {
                return address;
            }
        }
    }
    return '0.0.0.0'; // Default to 0.0.0.0 if no external IPv4 address found
}

/*
    IPv4 Configuration Guide:
        1. Localhost Setup:
            - For local development with Docker, replace `getIPv4()` with '127.0.0.1'.
        2. Production Setup:
            - Replace `getIPv4()` with the 'Public Static IPv4 Address' of the server hosting this application.
            - For AWS EC2 instances, replace `getIPv4()` with the 'Elastic IP' associated with the instance. 
            This ensures the public IP remains consistent across instance reboots.
    Note: Always enclose the IP address in single quotes ''.
*/
const IPv4 = getIPv4(); // Replace with the appropriate IPv4 address for your environment.

/*
    Set the port range for WebRTC communication. This range is used for the dynamic allocation of UDP ports for media streams.
        - Each participant requires 2 ports: one for audio and one for video.
        - The default configuration supports up to 50 participants (50 * 2 ports = 100 ports).
        - To support more participants, simply increase the port range.
    Note: 
    - When running in Docker, use 'network mode: host' for improved performance.
    - Alternatively, enable 'webRtcServerActive: true' mode for better scalability.
*/
const rtcMinPort = 40000;
const rtcMaxPort = 40100;

const numWorkers = require('os').cpus().length;

const ffmpegPath = getFFmpegPath(platform);

module.exports = {
    console: {
        /*
            timeZone: Time Zone corresponding to timezone identifiers from the IANA Time Zone Database es 'Europe/Rome' default UTC
        */
        timeZone: 'UTC',
        debug: true,
        colors: true,
    },
    server: {
        hostUrl: '', // default to http://localhost:port
        listen: {
            // app listen on
            ip: '0.0.0.0',
            port: process.env.PORT || 3010,
        },
        trustProxy: false, // Enables trust for proxy headers (e.g., X-Forwarded-For) based on the trustProxy setting
        ssl: {
            // ssl/README.md
            cert: '../ssl/cert.pem',
            key: '../ssl/key.pem',
        },
        cors: {
            /* 
                origin: Allow specified origin es ['https://example.com', 'https://subdomain.example.com', 'http://localhost:3010'] or all origins if not specified
                methods: Allow only GET and POST methods
            */
            origin: '*',
            methods: ['GET', 'POST'],
        },
        recording: {
            /*
                The recording will be saved to the directory designated within your Server app/<dir>
                Note: if you use Docker: Create the "app/rec" directory, configure it as a volume in docker-compose.yml, 
                ensure proper permissions, and start the Docker container.
            */
            enabled: false,
            endpoint: '', // Change the URL if you want to save the recording to a different server or cloud service (http://localhost:8080), otherwise leave it as is (empty).
            dir: 'rec',
            maxFileSize: 1 * 1024 * 1024 * 1024, // 1 GB
        },
        rtmp: {
            /*
                Real-Time Messaging Protocol (RTMP) is a communication protocol for streaming audio, video, and data over the Internet. (beta)

                Configuration:
                - enabled: Enable or disable the RTMP streaming feature. Set to 'true' to enable, 'false' to disable.
                - fromFile: Enable or disable the RTMP streaming from File. Set to 'true' to enable, 'false' to disable.
                - fromUrl: Enable or disable the RTMP streaming from Url. Set to 'true' to enable, 'false' to disable.
                - fromStream: Enable or disable the RTMP Streamer. Set to 'true' to enable, 'false' to disable.
                - maxStreams: Specifies the maximum number of simultaneous streams permitted for File, URL, and Stream. The default value is 1.
                - server: The URL of the RTMP server. Leave empty to use the built-in MiroTalk RTMP server (rtmp://localhost:1935). Change the URL to connect to a different RTMP server.
                - appName: The application name for the RTMP stream. Default is 'mirotalk'.
                - streamKey: The stream key for the RTMP stream. Leave empty if not required.
                - secret: The secret key for RTMP streaming. Must match the secret in rtmpServers/node-media-server/src/config.js. Leave empty if no authentication is needed.
                - apiSecret: The API secret for streaming WebRTC to RTMP through the MiroTalk API.
                - expirationHours: The number of hours before the RTMP URL expires. Default is 4 hours.
                - dir: Directory where your video files are stored to be streamed via RTMP.
                - ffmpegPath: Path of the ffmpeg installation on the system (which ffmpeg)
                - platform: 'darwin', 'linux', 'win32', etc.

                Important: Before proceeding, make sure your RTMP server is up and running. 
                For more information, refer to the documentation here: https://docs.mirotalk.com/mirotalk-sfu/rtmp/.
                You can start the server by running the following command:
                - Start: npm run nms-start - Start the RTMP server.
                - Stop: npm run npm-stop - Stop the RTMP server.
                - Logs: npm run npm-logs - View the logs of the RTMP server.
            */
            enabled: false,
            fromFile: true,
            fromUrl: true,
            fromStream: true,
            maxStreams: 1,
            server: 'rtmp://localhost:1935',
            appName: 'mirotalk',
            streamKey: '',
            secret: 'mirotalkRtmpSecret',
            apiSecret: 'mirotalkRtmpApiSecret',
            expirationHours: 4,
            dir: 'rtmp',
            ffmpegPath: ffmpegPath,
            platform: platform,
        },
    },
    middleware: {
        /*
            Middleware:
                - IP Whitelist: Access to the instance is restricted to only the specified IP addresses in the allowed list. This feature is disabled by default.
                - ...
        */
        IpWhitelist: {
            enabled: false,
            allowed: ['127.0.0.1', '::1'],
        },
    },
    api: {
        // Default secret key for app/api
        keySecret: 'mirotalksfu_default_secret',
        // Define which endpoints are allowed
        allowed: {
            stats: true,
            meetings: false,
            meeting: true,
            join: true,
            token: false,
            slack: true,
            mattermost: true,
            //...
        },
    },
    jwt: {
        /*
            JWT https://jwt.io/
            Securely manages credentials for host configurations and user authentication, enhancing security and streamlining processes.
         */
        key: 'mirotalksfu_jwt_secret',
        exp: '1h',
    },
    oidc: {
        /*
            OIDC stands for OpenID Connect, which is an authentication protocol built on top of OAuth 2.0. 
            It provides a simple identity layer on the OAuth 2.0 protocol, allowing clients to verify the identity of the end-user 
            based on the authentication performed by an authorization server.
            How to configure your own Provider:
                1. Sign up for an account at https://auth0.com.
                2. Navigate to https://manage.auth0.com/ to create a new application tailored to your specific requirements.
            For those seeking an open-source solution, check out: https://github.com/panva/node-oidc-provider
        */
        enabled: false,
        baseURLDynamic: false,
        peer_name: {
            force: true, // Enforce using profile data for peer_name
            email: true, // Use email as peer_name
            name: false, // Don't use full name (family_name + given_name)
        },
        config: {
            issuerBaseURL: 'https://server.example.com',
            baseURL: `http://localhost:${process.env.PORT ? process.env.PORT : 3010}`, // https://sfu.mirotalk.com
            clientID: 'clientID',
            clientSecret: 'clientSecret',
            secret: 'mirotalksfu-oidc-secret',
            authorizationParams: {
                response_type: 'code',
                scope: 'openid profile email',
            },
            authRequired: false, // Set to true if authentication is required for all routes
            auth0Logout: true, // Set to true to enable logout with Auth0
            routes: {
                callback: '/auth/callback', // Indicating the endpoint where your application will handle the callback from the authentication provider after a user has been authenticated.
                login: false, // Dedicated route in your application for user login.
                logout: '/logout', // Indicating the endpoint where your application will handle user logout requests.
            },
        },
    },
    host: {
        /*
            Host Protection (default: false)
            To enhance host security, enable host protection - user auth and provide valid
            usernames and passwords in the users array or active users_from_db using users_api_endpoint for check.
            When oidc.enabled is utilized alongside host protection, the authenticated user will be recognized as valid.
        */
        protected: false,
        user_auth: false,
        users_from_db: false, // if true ensure that api.token is also set to true.
        users_api_endpoint: 'http://localhost:9000/api/v1/user/isAuth',
        users_api_room_allowed: 'http://localhost:9000/api/v1/user/isRoomAllowed',
        users_api_rooms_allowed: 'http://localhost:9000/api/v1/user/roomsAllowed',
        api_room_exists: 'http://localhost:9000/api/v1/room/exists',
        //users_api_endpoint: 'https://webrtc.mirotalk.com/api/v1/user/isAuth',
        //users_api_room_allowed: 'https://webrtc.mirotalk.com/api/v1/user/isRoomAllowed',
        //users_api_rooms_allowed: 'https://webrtc.mirotalk.com/api/v1/user/roomsAllowed',
        //api_room_exists: 'https://webrtc.mirotalk.com//api/v1/room/exists',
        users_api_secret_key: 'mirotalkweb_default_secret',
        users: [
            {
                username: 'username',
                password: 'password',
                displayname: 'username displayname',
                allowed_rooms: ['*'],
            },
            {
                username: 'username2',
                password: 'password2',
                displayname: 'username2 displayname',
                allowed_rooms: ['room1', 'room2'],
            },
            {
                username: 'username3',
                password: 'password3',
                displayname: 'username3 displayname',
            },
            //...
        ],
    },
    presenters: {
        list: [
            /*
                By default, the presenter is identified as the first participant to join the room, distinguished by their username and UUID. 
                Additional layers can be added to specify valid presenters and co-presenters by setting designated usernames.
            */
            'Miroslav Pejic',
            'miroslav.pejic.85@gmail.com',
        ],
        join_first: true, // Set to true for traditional behavior, false to prioritize presenters
    },
    chatGPT: {
        /*
        ChatGPT
            1. Goto https://platform.openai.com/
            2. Create your account
            3. Generate your APIKey https://platform.openai.com/account/api-keys
        */
        enabled: false,
        basePath: 'https://api.openai.com/v1/',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
        temperature: 0,
    },
    videoAI: {
        /*
        HeyGen Video AI
            1. Goto  https://app.heygen.com
            2. Create your account
            3. Generate your APIKey https://app.heygen.com/settings?nav=API
         */
        enabled: false,
        basePath: 'https://api.heygen.com',
        apiKey: '',
        systemLimit: 'You are a streaming avatar from Attimo Conference, a product that specializes in video communications.',
    },
    email: {
        /*
            Configure email settings for notifications or alerts
            Refer to the documentation for Gmail configuration: https://support.google.com/mail/answer/185833?hl=en
        */
        alert: false,
        host: 'smtp.gmail.com',
        port: 587,
        username: 'your_username',
        password: 'your_password',
        sendTo: 'contato@attimo.com',
    },
    ngrok: {
        /* 
        Ngrok
            1. Goto https://ngrok.com
            2. Get started for free 
            3. Copy YourNgrokAuthToken: https://dashboard.ngrok.com/get-started/your-authtoken
        */
        enabled: false,
        authToken: '',
    },
    sentry: {
        /*
        Sentry
            1. Goto https://sentry.io/
            2. Create account
            3. On dashboard goto Settings/Projects/YourProjectName/Client Keys (DSN)
        */
        enabled: false,
        DSN: '',
        tracesSampleRate: 0.5,
    },
    webhook: {
        /*
            Enable or disable webhook functionality.
            Set `enabled` to `true` to activate webhook sending of socket events (join, exitRoom, disconnect)
        */
        enabled: false,
        url: 'https://your-site.com/webhook-endpoint',
    },
    mattermost: {
        /*
        Mattermost: https://mattermost.com
            1. Navigate to Main Menu > Integrations > Slash Commands in Mattermost.
            2. Click on Add Slash Command and configure the following settings:
                - Title: Enter a descriptive title (e.g., `SFU Command`).
                - Command Trigger Word: Set the trigger word to `sfu`.
                - Callback URLs: Enter the URL for your Express server (e.g., `https://yourserver.com/mattermost`).
                - Request Method: Select POST.
                - Enable Autocomplete: Check the box for Autocomplete.
                - Autocomplete Description: Provide a brief description (e.g., `Get MiroTalk SFU meeting room`).
            3. Save the slash command and copy the generated token (YourMattermostToken).   
        */
        enabled: false,
        serverUrl: 'YourMattermostServerUrl',
        username: 'YourMattermostUsername',
        password: 'YourMattermostPassword',
        token: 'YourMattermostToken',
        commands: [
            {
                name: '/sfu',
                message: 'Here is your meeting room:',
            },
            //....
        ],
        texts: [
            {
                name: '/sfu',
                message: 'Here is your meeting room:',
            },
            //....
        ],
    },
    slack: {
        /*
        Slack
            1. Goto https://api.slack.com/apps/
            2. Create your app
            3. On Settings - Basic Information - App Credentials, chose your Signing Secret
            4. Create a Slash Commands and put as Request URL: https://your.domain.name/slack
        */
        enabled: false,
        signingSecret: '',
    },
    discord: {
        /*
        Discord
            1. Go to the Discord Developer Portal: https://discord.com/developers/.
            2. Create a new application and name it whatever you like.
            3. Under the Bot section, click Add Bot and confirm.
            4. Copy your bot token (this will be used later).
            5. Under OAuth2 -> URL Generator, select bot scope, and under Bot Permissions, select the permissions you need (e.g., Send Messages and Read Messages).
            6. Copy the generated invite URL, open it in a browser, and invite the bot to your Discord server.
            7. Add the Bot in the Server channel permissions
            8. Type /sfu (commands.name) in the channel, the response will return a URL for the meeting
        */
        enabled: false,
        token: '',
        commands: [
            {
                name: '/sfu',
                message: 'Here is your SFU meeting room:',
                baseUrl: 'https://sfu.mirotalk.com/join/',
            },
        ],
    },
    IPLookup: {
        /*
        GeoJS
            https://www.geojs.io/docs/v1/endpoints/geo/
        */
        enabled: false,
        getEndpoint(ip) {
            return `https://get.geojs.io/v1/ip/geo/${ip}.json`;
        },
    },
    survey: {
        /*
        QuestionPro
            1. GoTo https://www.questionpro.com/
            2. Create your account
            3. Create your custom survey
        */
        enabled: false,
        url: '',
    },
    redirect: {
        /*
        Redirect URL on leave room
            Upon leaving the room, users who either opt out of providing feedback or if the survey is disabled 
            will be redirected to a specified URL. If enabled false the default '/newroom' URL will be used.
        */
        enabled: false,
        url: '',
    },
    ui: {
        /*
            Customize your MiroTalk instance
            Branding and customizations require a license: https://codecanyon.net/item/mirotalk-sfu-webrtc-realtime-video-conferences/40769970
        */
        brand: {
            app: {
                language: 'pt', // https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
                name: 'Attimo Conference',
                title: 'Attimo Conference<br />Chamadas de vídeo pelo navegador.<br />Simples, Seguro, Rápido.',
                description:
                    'Inicie sua próxima videochamada com um único clique. Não é necessário baixar, instalar plug-in ou fazer login. Comece a conversar, enviar mensagens e compartilhar sua tela imediatamente.',
                joinDescription: 'Escolha um nome para a sala.<br />Que tal este?',
                joinButtonLabel: 'ENTRAR NA SALA',
                joinLastLabel: 'Sua sala recente:',
            },
            site: {
                title: 'Attimo Conference, Chamadas de Vídeo, Mensagens e Compartilhamento de Tela',
                icon: '../images/logo5_alta_small.png',
                appleTouchIcon: '../images/logo5_alta_small.png',
                newRoomTitle: 'Escolha um nome. <br />Compartilhe a URL. <br />Inicie a conferência.',
                newRoomDescription:
                    'Cada sala tem sua URL descartável. Basta escolher um nome para a sala e compartilhar sua URL personalizada. É simples assim.',
            },
            meta: {
                description:
                    'Attimo Conference movido por WebRTC e mediasoup, videochamadas em tempo real Simples, Seguras e Rápidas, com recursos de mensagens e compartilhamento de tela no navegador.',
                keywords:
                    'webrtc, attimo, mediasoup, mediasoup-client, self hosted, voip, sip, comunicações em tempo real, chat, mensagens, meet, webrtc stun, webrtc turn, webrtc p2p, webrtc sfu, reunião por vídeo, chat por vídeo, conferência por vídeo, chat de vídeo múltiplo, conferência de vídeo múltipla, peer to peer, p2p, sfu, rtc, alternativa a, zoom, microsoft teams, google meet, jitsi, meeting',
            },
            og: {
                type: 'app-webrtc',
                siteName: 'Attimo Conference',
                title: 'Clique no link para fazer uma chamada.',
                description: 'Attimo Conference oferece videochamadas em tempo real, mensagens e compartilhamento de tela.',
                image: '../images/logo5_alta_small.png',
                url: 'https://attimo.com',
            },
            html: {
                features: true,
                teams: true,
                tryEasier: true,
                poweredBy: false,
                sponsors: false,
                advertisers: false,
                footer: true,
            },
            about: {
                imageUrl: '../images/logo5_alta_small.png',
                title: `Attimo Conference`,
                html: `
                    <hr />
                    <span>&copy; 2025 Attimo Conference, todos os direitos reservados</span>
                    <hr />
                `,
            },
            //...
        },
        /*
            Toggle the visibility of specific HTML elements within the room
        */
        buttons: {
            main: {
                shareButton: true, // presenter
                hideMeButton: true,
                startAudioButton: true,
                startVideoButton: true,
                startScreenButton: true,
                swapCameraButton: true,
                chatButton: true,
                pollButton: true,
                editorButton: true,
                raiseHandButton: true,
                transcriptionButton: true,
                whiteboardButton: true,
                documentPiPButton: true,
                snapshotRoomButton: true,
                emojiRoomButton: true,
                settingsButton: true,
                aboutButton: true,
                exitButton: true,
            },
            settings: {
                fileSharing: true,
                lockRoomButton: true, // presenter
                unlockRoomButton: true, // presenter
                broadcastingButton: true, // presenter
                lobbyButton: true, // presenter
                sendEmailInvitation: true, // presenter
                micOptionsButton: true, // presenter
                tabRTMPStreamingBtn: true, // presenter
                tabModerator: true, // presenter
                tabRecording: true,
                host_only_recording: true, // presenter
                pushToTalk: true,
                keyboardShortcuts: true,
                virtualBackground: true,
            },
            producerVideo: {
                videoPictureInPicture: true,
                videoMirrorButton: true,
                fullScreenButton: true,
                snapShotButton: true,
                muteAudioButton: true,
                videoPrivacyButton: true,
                audioVolumeInput: true,
            },
            consumerVideo: {
                videoPictureInPicture: true,
                videoMirrorButton: true,
                fullScreenButton: true,
                snapShotButton: true,
                focusVideoButton: true,
                sendMessageButton: true,
                sendFileButton: true,
                sendVideoButton: true,
                muteVideoButton: true,
                muteAudioButton: true,
                audioVolumeInput: true,
                geolocationButton: true, // Presenter
                banButton: true, // presenter
                ejectButton: true, // presenter
            },
            videoOff: {
                sendMessageButton: true,
                sendFileButton: true,
                sendVideoButton: true,
                muteAudioButton: true,
                audioVolumeInput: true,
                geolocationButton: true, // Presenter
                banButton: true, // presenter
                ejectButton: true, // presenter
            },
            chat: {
                chatPinButton: true,
                chatMaxButton: true,
                chatSaveButton: true,
                chatEmojiButton: true,
                chatMarkdownButton: true,
                chatSpeechStartButton: true,
                chatGPT: true,
            },
            poll: {
                pollPinButton: true,
                pollMaxButton: true,
                pollSaveButton: true,
            },
            participantsList: {
                saveInfoButton: true, // presenter
                sendFileAllButton: true, // presenter
                ejectAllButton: true, // presenter
                sendFileButton: true, // presenter & guests
                geoLocationButton: true, // presenter
                banButton: true, // presenter
                ejectButton: true, // presenter
            },
            whiteboard: {
                whiteboardLockButton: true, // presenter
            },
            //...
        },
    },
    stats: {
        /*
            Umami: https://github.com/umami-software/umami
            We use our Self-hosted Umami to track aggregated usage statistics in order to improve our service.
        */
        enabled: true,
        src: 'https://stats.mirotalk.com/script.js',
        id: '41d26670-f275-45bb-af82-3ce91fe57756',
    },
    mediasoup: {
        // Worker settings
        numWorkers: numWorkers,
        worker: {
            rtcMinPort: rtcMinPort,
            rtcMaxPort: rtcMaxPort,
            disableLiburing: false, // https://github.com/axboe/liburing
            logLevel: 'error',
            logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp', 'rtx', 'bwe', 'score', 'simulcast', 'svc', 'sctp'],
        },
        // Router settings
        router: {
            audioLevelObserverEnabled: true,
            activeSpeakerObserverEnabled: false,
            mediaCodecs: [
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2,
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP9',
                    clockRate: 90000,
                    parameters: {
                        'profile-id': 0, // Default profile for wider compatibility
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP9',
                    clockRate: 90000,
                    parameters: {
                        'profile-id': 2, // High profile for modern devices
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '42e01f', // Baseline profile for compatibility
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000,
                    },
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '4d0032', // High profile for modern devices
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000,
                    },
                },
            ],
        },
        // WebRtcServerOptions
        webRtcServerActive: false,
        webRtcServerOptions: {
            listenInfos: [
                // { protocol: 'udp', ip: '0.0.0.0', announcedAddress: IPv4, port: rtcMinPort },
                // { protocol: 'tcp', ip: '0.0.0.0', announcedAddress: IPv4, port: rtcMinPort },
                {
                    protocol: 'udp',
                    ip: '0.0.0.0',
                    announcedAddress: IPv4,
                    portRange: { min: rtcMinPort, max: rtcMinPort + numWorkers },
                },
                {
                    protocol: 'tcp',
                    ip: '0.0.0.0',
                    announcedAddress: IPv4,
                    portRange: { min: rtcMinPort, max: rtcMinPort + numWorkers },
                },
            ],
        },
        // WebRtcTransportOptions
        webRtcTransport: {
            listenInfos: [
                // { protocol: 'udp', ip: IPv4, portRange: { min: rtcMinPort, max: rtcMaxPort } },
                // { protocol: 'tcp', ip: IPv4, portRange: { min: rtcMinPort, max: rtcMaxPort } },
                {
                    protocol: 'udp',
                    ip: '0.0.0.0',
                    announcedAddress: IPv4,
                    portRange: { min: rtcMinPort, max: rtcMaxPort },
                },
                {
                    protocol: 'tcp',
                    ip: '0.0.0.0',
                    announcedAddress: IPv4,
                    portRange: { min: rtcMinPort, max: rtcMaxPort },
                },
            ],
            initialAvailableOutgoingBitrate: 1000000,
            minimumAvailableOutgoingBitrate: 600000,
            maxSctpMessageSize: 262144,
            maxIncomingBitrate: 1500000,
        },
    },
};
