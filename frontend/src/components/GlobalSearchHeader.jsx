import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalSearchHeader({ search, setSearch, categories, setActiveCategory, products }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search || "");
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("mq_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem("mq_search_history", JSON.stringify(history));
    } catch {
      // ignore
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNa  import { useNavigate } from "react-router-dom";
import { Search, X,boimport { Search, X, Clock, ArrowRight } from "  import { motion, AnimatePresence } from "framer-motion";

e{

export default function GlobalSearchHeader({ search, ssOp  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search || "mm  const [localSearch, setLocalSearch] = use
     const [history, setHistory] = useState(() => {
    try {
   mm    try {
      const saved = localStorage.getIlt      coic      return saved ? JSON.parse(saved) : [];
    } catch {
  al    } catch {
      return [];
    }
  });
t       return =    }
  });
  cry  });
  coon  const navigate = useNavigate() 
  useEffect(() => {
    setLoca  s    setLocalSearch>   }, [search]);

  useEffect(() 
 
  useEffect((and    try {
      lo(c      lo
     } catch {
      // ignore
import React, { useState, useEffect, useRe);      // ignstimport React,  uimport { useNa  import { useNavigate } from "react-router-dom";
imptuimport { Search, X,boimport { Search, X, Cloase();
    return pr
e{

export default function GlobalSearchHeader({ search, ssOp  const [isOpen, setIsOpen] = useState(false);
  const [localS0, 
);
  const [localSearch, setLocalSearch] = useState(search || "mm  const [localSearch, setLocalSearch] = cl     const [history, setHistory] = useState(() => {
    try {
   mm    try {
      const saved = localSth-    try {
   mm    try {
      const saved = localho   mm           con{searc    } catch {
  al    } catch {
      return [];
    }
  });
t        </div>
      </div>

     al    } care      return [];is    }
  });
       })mot   .d  });
  cry  });
  cNa  crgs  coon  c
   useEffect(() => {
    setLoca  s    20    setLoca  s    im
  useEffect(() 
 
  u0 }}
            exit={{ opac 
  useEffect( }}
      lo(c      lo
     {      } catch {
          // igno  import React, asimptuimport { Search, X,boimport { Search, X, Cloase();
    return pr
e{

export default function GlobalSearchHeader({ search, ssOp  con      return pr
e{

export default function GlobalSearchhSe{

export dea
ch)  const [localS0, 
);
  const [localSearch, setLocalSearch] = useState(search || "mm  const [localSear  );
  const [localut       try {
   mm    try {
      const saved = localSth-    try {
   mm    try {
      const saved = localho   mm           con{searc    } catch {
  al    }arch}
            const snC   mm    try {
      const saved = lo.v      const s    al    } catch {
      return [];
    }
  });
t        </div>
         return [];ar    }
  });
t          t   bu      </div>

to
     al   e="  });
       })mot   .d  });
  cry  });ar    ")  cry  });
  cNa  crg    cNa  cr16   useEffect(() =>       setLoca  s         useEffect(() 
 
  u0 }}
            e   
  u0 }}
    lass      gs  useEffect( }}
      lo =      lo(c    ls     {   lar</butto          // igno  i>
    return pr
e{

export default function GlobalSearchHeader({ search, ssOp  con      retgge{

export dth
> 0e{

export default function GlobalSearchhSe{

export dea
ch)  const [localS0ss
ame
export dea
ch)  const [localS0, 
);
     ch)  cons  );
  const [localSeasu ge  const [localut       try {
   mm    try {
      const saved = localSth-         <li   mm    try {
      const {       con`/prod   mm    try {
   IsOpen(false); }}>
        const s    al    }arch}
            const snC   mm    try {
      const sle            c        const saved = lo.v      cons={      return [];
    }
  });
t        </div>
         r/l    }
  });
t      })  t              retur    });
t          t   bu  ivt     
to
     al   e="  });
     {!l ca       })mot ) && h  cry  });ar    ")  c(
  cNa  crg    cNa  cr16   uam 
  u0 }}
            e   
  u0 }}
    lass      gs  useEffect( }}
      lo =            h4  u0 }}
    lasse    lati      lo =      lo(c    ls    
     return pr
e{

export default function GlobalSearchHeader({ seHie{

export dr<
but
export dth
> 0e{

export default function GlobalSearchhSe{

export dea
chlis> 0e{

ex  
exp   
export dea
ch)  const [localS0ss
ame
e   ch)  cons  ame
export dea
ch)  {(ex=>ch)  consal);
     ch)  cons  )rc Su  const [localSea     mm    try {
      const saved = localSth-     hi      const s        const {       con`/prod   mm    try {
   IsOpen(     IsOpen(false); }}>
        const s    aic        const s    aor            con                       const sle            c            }
  });
t        </div>
         r/l    }
  });
t      })  t              ret    })  t   /u                  });
tv>
        t     t          t   bu  ivt     
to
     a) to
     al   e="  });
    && (
     {!l ca      di  cNa  crg    cNa  cr16   uam 
  u0 }}
            ss  u0 }}
            e   
  u0ra      go  u0 }}
             la        lo =            h4  u0 }
     lasse    lati      lo =   .m     return pr
e{

export default function Glo{ce{

export degs-chi
export dr<
but
export dth
> 0e{

export default f   but
e      ex {> 0e{

ex  
exp   
export dea
chlis> 0e{

ex  
exp   
exp}
 chlis> 0e  
ex   </div>exp  expor  ch)  consv>ame
e   ch)  cons  a  e   export dea
ch)  {  ch)  {(exn.     ch)  cons  )rc Su /A      consence>
    </>
  );
}
