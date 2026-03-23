import React, { useEffect, useState } from "react"; 
import { startAuthentication, startRegistration } from "@simplewebauthn/browser"; 
 
function App() { 
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"; 
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""; 
  const [message, setMessage] = useState(""); 
 
  const [isLogged, setIsLogged] = useState(false); 
  const [userEmail, setUserEmail] = useState(""); 
 
  const [title, setTitle] = useState(""); 
  const [price, setPrice] = useState(""); 
  const [products, setProducts] = useState([]); 
 
  useEffect(() => { 
    const token = localStorage.getItem("token"); 
    const savedEmail = localStorage.getItem("userEmail"); 
 
    if (token) { 
      setIsLogged(true); 
      setUserEmail(savedEmail || ""); 
      fetchProducts(); 
    } 
  }, []); 
 
  useEffect(() => { 
    if (isLogged) return; 
    if (!GOOGLE_CLIENT_ID) return; 
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return; 
 
    window.google.accounts.id.initialize({ 
      client_id: GOOGLE_CLIENT_ID, 
      callback: handleGoogleResponse, 
    }); 
 
    const el = document.getElementById("googleSignInDiv"); 
    if (el) { 
      el.innerHTML = ""; 
      window.google.accounts.id.renderButton(el, { 
        theme: "outline", 
        size: "large", 
        width: "350", 
      }); 
    } 
  }, [isLogged, GOOGLE_CLIENT_ID]); 
 
  const fetchProducts = async () => { 
    try { 
      const token = localStorage.getItem("token"); 
 
      const response = await fetch(`${API_URL}/api/products`, { 
        headers: { 
          Authorization: `Bearer ${token}`, 
        }, 
      }); 
 
      const data = await response.json(); 
 
      if (!response.ok) { 
        setMessage(data.message || "Error al obtener productos"); 
        return; 
      } 
 
      setProducts(data.products || []); 
    } catch (error) { 
      setMessage("Error al obtener productos"); 
    } 
  }; 
 
  const handleRegisterPasskey = async () => { 
    try { 
      const token = localStorage.getItem("token"); 
 
      const optionsResponse = await fetch(`${API_URL}/api/auth/webauthn/register/options`, { 
        headers: { 
          Authorization: `Bearer ${token}`, 
        }, 
      }); 
 
      const options = await optionsResponse.json(); 
 
      if (!optionsResponse.ok) { 
        setMessage(options.message || "Error al iniciar huella"); 
        return; 
      } 
 
      const attResp = await startRegistration(options); 
 
      const verifyResponse = await fetch(`${API_URL}/api/auth/webauthn/register/verify`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}`, 
        }, 
        body: JSON.stringify(attResp), 
      }); 
 
      const verifyData = await verifyResponse.json(); 
      setMessage(verifyData.message || "Huella registrada"); 
    } catch (error) { 
      setMessage("Error al registrar huella"); 
    } 
  }; 
 
  const handlePasskeyLogin = async () => { 
    try { 
      const optionsResponse = await fetch(`${API_URL}/api/auth/webauthn/login/options`); 
      const options = await optionsResponse.json(); 
 
      if (!optionsResponse.ok) { 
        setMessage(options.message || "Error al iniciar sesión con huella"); 
        return; 
      } 
 
      const authResp = await startAuthentication(options); 
 
      const verifyResponse = await fetch(`${API_URL}/api/auth/webauthn/login/verify`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
        }, 
        body: JSON.stringify(authResp), 
      }); 
 
      const data = await verifyResponse.json(); 
 
      if (data.token) { 
        localStorage.setItem("token", data.token); 
        localStorage.setItem("userEmail", data.user?.email || ""); 
        setIsLogged(true); 
        setUserEmail(data.user?.email || ""); 
        fetchProducts(); 
      } 
 
      setMessage(data.message || "Login completado"); 
    } catch (error) { 
      setMessage("Error al iniciar sesión con huella"); 
    } 
  }; 
 
  const handleGoogleResponse = async (response) => { 
    try { 
      const loginResponse = await fetch(`${API_URL}/api/auth/google`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
        }, 
        body: JSON.stringify({ credential: response.credential }), 
      }); 
 
      const data = await loginResponse.json(); 
 
      if (data.token) { 
        localStorage.setItem("token", data.token); 
        localStorage.setItem("userEmail", data.user?.email || ""); 
        setIsLogged(true); 
        setUserEmail(data.user?.email || ""); 
        fetchProducts(); 
      } 
 
      setMessage(data.message || "Login completado"); 
    } catch (error) { 
      setMessage("Error al iniciar sesión"); 
    } 
  }; 
 
  const handleCreateProduct = async () => { 
    try { 
      const token = localStorage.getItem("token"); 
 
      const response = await fetch(`${API_URL}/api/products`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}`, 
        }, 
        body: JSON.stringify({ 
          title, 
          price, 
        }), 
      }); 
 
      const data = await response.json(); 
      setMessage(data.message || "Producto creado"); 
 
      setTitle(""); 
      setPrice(""); 
 
      if (response.ok) { 
        fetchProducts(); 
      } 
    } catch (error) { 
      setMessage("Error al crear producto"); 
    } 
  }; 
 
  const handleLogout = () => { 
    localStorage.removeItem("token"); 
    localStorage.removeItem("userEmail"); 
    setIsLogged(false); 
    setUserEmail(""); 
    setMessage("Sesión cerrada"); 
  }; 
 
  if (isLogged) { 
    return ( 
      <div className="app"> 
        <div className="card"> 
          <h1>MAQUETI</h1> 
          <p>Usuario: {userEmail}</p> 
 
          <input 
            type="text" 
            placeholder="Nombre del producto" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          /> 
 
          <input 
            type="number" 
            placeholder="Precio" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
          /> 
 
          <button onClick={handleCreateProduct}> 
            Crear producto 
          </button> 
 
          <button onClick={handleRegisterPasskey}> 
            Activar huella 
          </button> 
 
          <button onClick={fetchProducts}> 
            Cargar productos 
          </button> 
 
          {products.length === 0 ? ( 
            <p>No hay productos</p> 
          ) : ( 
            <ul> 
              {products.map((product) => ( 
                <li key={product.id}> 
                  {product.title} - {product.price} 
                </li> 
              ))} 
            </ul> 
          )} 
 
          <button onClick={handleLogout}> 
            Cerrar sesión 
          </button> 
 
          {message && <p>{message}</p>} 
        </div> 
      </div> 
    ); 
  } 
 
  return ( 
    <div className="app"> 
      <div className="card"> 
        <h1>MAQUETI</h1> 
        <p>Accede con Google</p> 
 
        {!GOOGLE_CLIENT_ID ? ( 
          <p>Falta configurar VITE_GOOGLE_CLIENT_ID</p> 
        ) : ( 
          <div id="googleSignInDiv"></div> 
        )} 
 
        <button type="button" onClick={handlePasskeyLogin}> 
          Iniciar con huella 
        </button> 
 
        {message && <p>{message}</p>} 
      </div> 
    </div> 
  ); 
} 
 
export default App; 
