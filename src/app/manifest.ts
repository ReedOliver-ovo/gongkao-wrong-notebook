import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '智能错题本',
        short_name: '错题本',
        description: '考公/考编 AI 错题复盘系统，支持错题录入、二刷提醒和周报复盘',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f97316',
        orientation: 'any',
        icons: [
            {
                src: '/icons/icon.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
