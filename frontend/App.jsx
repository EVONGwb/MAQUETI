import React, { useEffect, useState } from "react"; 
 
function App() { 
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"; 
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
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
 
  const handleRegister = async () => { 
    try { 
      const response = await fetch(`${API_URL}/api/register`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
        }, 
        body: JSON.stringify({ name, email, password }), 
      }); 
 
      const data = await response.json(); 
      setMessage(data.message || "Registro completado"); 
    } catch (error) { 
      setMessage("Error al registrar usuario"); 
    } 
  }; 
 
  const handleLogin = async () => { 
    try { 
      const response = await fetch(`${API_URL}/api/login`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
        }, 
        body: JSON.stringify({ email, password }), 
      }); 
 
      const data = await response.json(); 
 
      if (data.token) { 
        localStorage.setItem("token", data.token); 
        localStorage.setItem("userEmail", email); 
        setIsLogged(true); 
        setUserEmail(email); 
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
        <p>Accede o crea tu cuenta</p> 
 
        <form className="form"> 
          <input 
            type="text" 
            placeholder="Nombre" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          /> 
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          /> 
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          /> 
 
          <button type="button" onClick={handleRegister}> 
            Registrarse 
          </button> 
          <button type="button" onClick={handleLogin}> 
            Iniciar sesión 
          </button> 
        </form> 
 
        {message && <p>{message}</p>} 
      </div> 
    </div> 
  ); 
} 
 
export default App; 
