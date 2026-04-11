'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation' // <-- Herramienta para cambiar de página

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const router = useRouter() // <-- Activamos la herramienta

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje('Iniciando sesión...')
    
    // Aquí Supabase verifica si el usuario existe
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      // Si la contraseña está mal, mostramos el error
      setMensaje('Error: Correo o contraseña incorrectos.')
    } else {
      // Si todo está bien, lo mandamos al Dashboard
      setMensaje('¡Acceso concedido! Entrando...')
      router.push('/dashboard') 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">Eline Registro Escolar</h1>
        <p className="text-center text-gray-600 mb-6">Acceso para Docentes</p>
        
        <form onSubmit={manejarLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Entrar al Sistema
          </button>
        </form>

        {mensaje && (
          <p className={`mt-4 text-center text-sm font-medium ${mensaje.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {mensaje}
          </p>
        )}
      </div>
    </div>
  )
}