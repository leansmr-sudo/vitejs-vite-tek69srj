import { useState, useMemo, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import * as jspdfModule from "jspdf";
import * as autoTableModule from "jspdf-autotable";
const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
const autoTable = autoTableModule.default || autoTableModule;

const LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAIAAACzY+a1AAAQAElEQVR4AezdB5TV1dEA8P97W2l2Oip1wYYSRTSJxo5iLChGE3uKmmZLLLElNixRRFBQo1GJxh4TY4wYe1essYOANMUKCAsLu/ve99udL+/bj90lu7JvgXPcM7mZ/9y5c6fcmVve4Zj++m+N90Dy9d8a7oH0Gq7/1+onX4dwjV8EX4fw6xCu8R5Y4w34Ogu/DuEa74E13oBVloWZ//xxYdzMIGipVKqkpEQLRykoKIADn8XFxT6z2Wxpaak2iBBdhmj1FhYWaoNILGIOioqKAo+B2Hy2b99eCyccYkYSIAHoEBQzag0kEw9iABwlpkPBg9LK0KQQ5kMn7mAwt3JBde0fhKegS5cuhYtK27ZteQeFd3QFrl28eLEWXQAg1CMK/9prr92pU6devXptvvnm22677ZZbbrld7d+mm246YMCAsrKyPn36bLDBBphJpoCBX375ZceOHSsrKysqKkgD6MIZDOh4li1bZkatGfWKq5bmuihWVVXlk0zgE7GVYZWFkCMYz0daAeM1weBH9nMEOpfh0YWiV5fQ5uK00047/fjHPz7jjDPuuuuuu+++++GHH37rrbfeeeedd99994033njttddeeOGFl1566bnnnnvqqaei68knn3zmmWcwYDbqD3/4w/jx43/1q199+9vfFm/hX7RokYjSRzDEzNSma9OmjdlDE6GimECKHzYMgHo01+IxENLKsMpCyGyu4SDu4BThYblUCyLXYFiwYIFAomy88cYjRow47bTTbrvtNuF5//33H3vssUsvvfT0009HHz58+BZbbLHhhhuutdZa7dq1w284gYCQnFt1de7cef311xezXXfd9YgjjjjuuOMuueSSG2+8UbxnzZol2H/84x9PPPHEb37zmx06dAghS5YsoQPdhFOQIFYYsUBECQcQETWddYahlWGVhVCl4iPeET9R5HeO4AUUXuMs9fAHP/iBROFZ2SNvLr744r322mujjTbCw03rrruuXJk/fz45lgIJiOFK7cSJE0eOHCk2iHfcccfll1/++eefw+Wo1ozmFQZOl38oIrT11lsfffTRZ5555r/+9S+Ja8bf/e53O++8swWEmVaCZyLrDD/EvJGUNDc7IFZXK8MqC+HChQsjEvzIEXBI+FG2SbIXX3zxpptukiiqnC2K+ziRm7QXXHCBuPKUHIJ/9tlnYulTr5wQfnDvvfeed955jzzyCH75+utf/3rmzJkm/f73v29Z8P6tt94qYBdeeOGbb74ZYyPGdPApp/fYY49zzjnnn//856OPPir7jzrqqG7dupEm6mIGoTY5JvVJf2Bg68MqC2EYz9cixwXbbLONJHv++ecnTZoE+da3vqUqigePyKRjjz3WrhafH3zwwejRo/Eos8ZKF+moiwf5FCASaGPjcdGdMmWK5DaRQipL8A8bNuz8888/4YQTeH/atGmKsEiTb18UReXhvffemzFjhjwTp5KSkt69ex9yyCHqrQx+4IEHxFJBtqroJjuB2c3o09TaVoZVFkJZZTmrilwppXhQomyyySY5L0B4B9j8JkyYwHHKI+/wrLOl5Ljuuuu+8Y1vzJkzR3gAJ4oQgGMTQjVQJO68804ex1leXo7Z+VNgRo0adc0115Bw++23X3311eaSoxMnThQYvQ5KumT2n/70p48//thADGSus846Krkusbziiiv2228/AaYVQ2JeRmFrZWixEDLSomYDV1qVgSBa1Ezi1thCgo7BkVJgZBhfyDk8fEeCDLAF7rDDDjYwRLnlDPmjH/3IfUAUUdwKOFoiXnXVVbYrTkQknxMhgAJyUY5utdVWKqcq+stf/hLSt29fGSkXP/30U+E5+OCDn3jiCYcaSg4aNMiaoFJImzp16ne+8x3RtaocbYRKxSbZKK2JbJ/C/Ne//pX+J598soVIT6tNFwZAB+CT1XRjNWKeoMVCSF2Lkd48YmFSPXDZEDaIEEt4/6CDDrr//vud7A8//PD11lsPv4GCaogieeCBB/IIb2JAdFrhcQeK448/npdvueUWBRbb4MGDzz777L/97W+RJSSTTw43mZcyJuXT7t27y1rhFxV01wxB8ulcSr44OTQJ8IMPPijk7pEK79tvv+1qIWul72GHHTZ58uSf/exnzz77rAwWJ4tGWTaL6SwUQxyUlJBx48Ztv/32umwQ1KYAu3yKOjZEQ/IELRbCVCpFUQ7iKbryqUDapRgD503L/8gjj7TwHQ1EiIsx4IxRENGSgkrf0KFDN9tsM/4VHld1qcNNksmF/dRTT8Xgqv7KK6/Ig/333990NjBChMrsvMxxpvvhD3/43e9+1ypxqrQCfvrTnwqwKqpW2yNlOYoN1QpTJxBfffVV8RDaf//739gUT6cYS0QiWjT33Xcfoprv9GQW8unPNGqbjkDSlA03VJrTwVwCqZd62LTwPEGLhZAlrKI6RWlvDUIsZ2tQeTz00EOffvppJ0yrG51V4ocNbmAwizfPylF+d7IXLRe+uXPnOoDYrlQtqaCsaU866SSLwNjLLruM42RtSOApsSRcK7q86f6HWQyuvPLKrl27HnXUUTfccIOBlpETjUSU4r///e8VUsXcjVBmkyn2giHwFhwGGUYHhigDyqbhFiWjUCgvokERSCXEzn3ttdcOHDhQIPEoLdjogydP0GIhlAQ8CASGhYDGDOBKZVMBtMZVFetXF8vDKp85C+ESQpjlgXSUFnZBN0IHyH333VdgCFTH3Ar23ntv4bEIRMULGrqk0QKzkyyiFoRPYFWRbEY49ZRuFDzeBITQfiyb0Z1cVNSPP/7YHUbiSrsuXbqoHDS//vrrTXfKKaeQqZCQwwTpay7xg9OEQCuYLXqPOeYYBzSLxtpSb2kO0PMELRZCulp3LOEvtkE4i/3uZ06Gob0I6WUzy3mNo4HYR6+Wo53dHTiVL4nLcZLy5ptv7tChAy8omEZh01oNZhEMEsTPFos+b948DzfTp0931ePExx9/3P0Souq6ZX7yySezZ89WGAzHbCCP04dkRFoJklc3pyTlVA2QuzQHL7/8smIgt5xFRcso+psxJyekaYnS0g2DzduT3mmnnUYaCnqeoMVCSD/LEDCSXziIhU4T6ELrE6JLbeF6n3q1cEN0wUUdSDLuc6z4yU9+8tBDDwWb9WGgQOIUMLgpxEaQPMH84he/UHKdP4VcC9wyd9llFxcAraoosSA9evRQ3/r37y9xUb73ve/ZYtVVbzF0EELCxVLmOb5K9H/84x+OOTZmuS54KopIUFicRJHC+IGxiPRB9Ek9K1UILUeLwHarJntk15UnaLEQsoQZokVRxrhCSRpu4hT2iAQ6U1mOLT5RBFULUADv8JQQSl9ZyJW6eESmcrEk446LLrrISUc8dtttN0Gypam96t7rr78uz3jQjBQgWY4aDihgcSBaCvLJdgVsrr/5zW8UT68w3mKcJ10wEBVwehrljOq8ait1jFJslVMb4T777GMzDmOphC3AEMA6KwCFjSa11OBi+eGHH0LyBM0OIb0ZwNdaOvkEtKc0RwNdPqWRRw2ng9CeQ1nCQnEy0BBjuRUnBBgeRDx8DbA5joqiQ4TNSXWVXrzsSUyBEidDzIWTHBK0xmqXA1Pj0aIHG8RYLQi6aImc7dBW51zjsdR+JjtdRUTCsnBUUR4slAMOOIAhBlIvFCYBkMw0EES9iGYB6rAWXUS1lGQ1CZjprwWG6wrA4LPp0OwQMol+zOAXU/qkB4ROWoBOe75wBHWyl5e2IkobRVfGUA5bTlE4aQCnsXgIJEGd9OIlORyIzj33XAcNtw4M5JCGh5yQBll5IFABYA5N/GhlU2TCkCFDXA0dX81uin79+jlz+qEDTk+aUIAyAEI3dJoHgkiao6wdwauhAo4fA8PFEj8wl5YHEAmMIVqfOJsIzQ4hPaJASTiTUdd89KYHgNsAXJ78amMLUbhUIUMgmOkE19KbxhBDtExVLXmQH9msNtq0dtxxR89gvEk4HidA8wZuuaCYK4bDVx4soJBPMUCgT9npjUZGOk6LhDsG6yjJHOUBW04BCLpRwgPhFjZ6DcBjTxF7p2vhx0B5tqDD+cQnn/gMcyAocL1NhGaHkKkmNhMzQm84cP6kt9bO5FbH1/QAeNRDR0QKZTIZPGwjwQJEoa5PCDb7kPOnImYF+PVOUIVWF4CwE7OJ8NOBHEN0tRSEfAoDswDyWWFqFFnILrsv9bwIosfZihoU0KJAKIaZhlRF/OijjwTPJ3u1XmXt8R7ncAZgNq9eLYoZScAJbzo0O4R0BTIGmFIkTEmVL774wj6h7jscqngWIy8IA/1YC8GAn2boNOYaOGCqSuVSb5H+5S9/IRwDOskAAiDkGMU1PgOw1f0M4lduSQsg00Smg5CGCIdo6WZTOOusswRSbffOxwm6pJ2aBMGsNVwkRN3RJhjojw53RnPPcSTmMcxcx3xi9QZwEWLgTWybHUITAymoztDVND7VCu/OImHbR/Hpfub0SDnnUmdFL1jONQxjLX6nczbMmzfPqvTO4l3bvc1NKwzAxmaW8JrYR7AR9RqLyLkBoYAZVx6oakYQCPVMZCFS1Vwm4muzU4Ym3vycsPbcc0/PftarrlAgNIQzzUAPgW6ihvOVIRaxEqom2+a9uxKOE8SMPAMwo0QLaQo0O4SMiQmsKU43h9cpL8LeD3UxBiDqdav1xr/77ru7FLOHxh6rdHFE4M7o3tJs9XZN/nLI1Au4j6iwh/GWSxA5CAJI0LY4sMukgHxuFSpAE3E1l5ZiKHpxMtATkmuJA5f3P7EBAoyTwqLFObZSr3cW6JgxY7wxOaUj6mWsBwS3FO+uth4zMo1wc5FMgim0TYRmh5BtRKuNnEtFp3zJJ040owFtqEIh9za4H0jdwDw2ss2twILlAr/MKUf4e/bsGXd/ewax+NkGmMEG0shBN53hKOhwrgS6tOZCaSkgDYQ0c1GAShQwEQRdi8HUgPmiKCTOKTZvD+JupZixKSHAXdO25yDqQCRZ0RUnLQlaEhRVbxfYOBPFWBOhBwNKE6HZIeRitjmPeQB0kbJFi5C5bQbyT7ZhoI1HDaUDkUIW6d///ncKOZ26F6urNgldtgQRRbcSDZGaWsCMAKJ4TfB4hByAYqCIcrGBwYwH6DUKnXoQoKp7f3GS1IUIEEmDoMC1pBkLJ80ngQCCDSAGCBiEgVrGauuCRzg/fj3//PPqjQdet8l4jmGp10GcFRUVKuo555xjW7E1BIV8DvGLo9uLYNOcGlorA0PTodkhZGFMo/rJKjdib5LmNiXbQj8B9ojs4Z/rXfD9YOt3WkSuobQHDi9hwsZU7jNQ2dEKJ6tQwsU+WR7TIQLDUawSYukg5GJpoE/MRvlEpwbi0Ucfbcuhg0XmhuoXEgHQS4henMCna7vh5kX0aRarxCchpjbELCgAwrnAQGw+KaN4umZ4BbWOFUzPeDYL8bBGCfQEwTMylcAtttiCc9RSo3QZrjUjaX4bdGW91wAAEABJREFUEV2STRoZCdHbRGh2CMllGz0cQE4//XT3XJu2RefHBP7685//zF9MsvbPOOMM0bLhuWP4kYgBHCFyYsBORG/ZzjjoLCSWv9hDOJyP4Fo4e3Shh/dRdBGFEt4XPC5D8SmWNmAPOi6mloh15v3MO5mnFrFUzPmUNDI5MeQTCDc8uvSayCf/6iIQsy4IqwFEl5bmomULd3DzOo/Hqc3jX9++fa0M6nm9c5XkJQrY8t1G1FUSHHak7K233qpIeLhwCXYVxm86XazIKYbyX+GrhJDLLBl+pyhrWegOq1QyQ03wqGhXMLFA2sxVfHsAvxiFM4wXbDu87VBEcRIiTdU05gkGh3IHS4zShcGoAJNC0HkQ3ScGYmWDIZ5kHdld4Bz6XVFc47yIothxvazKS+8GDlnOXySoCiGEHDIBx1ESgkIayRD6UCwXURR0AzFbi4Eoj37y9ZZkaVIJj1GG4BRmPrFZEktJm58V5lDqHO7dx2uw4wKt1DP8ZgcQ6hHSRPgqIbReWAjMISEYw91UhOsC7vK66OFiq4zAmaql3z333MPFliebpa8SyhG6VBgRZXlFRYWBKMTmgFWm01o6JoIDPJyLxw97Foof/+LnX6dEZc2PXBj8wkcfrnTnkSJ+cBBLQdXriZwoPLSiPw1xMsEUwkC+1icixfTiNB0NqUEgJeFaIB5+HbRoXBbffvttCxGz1tqCONl5soBQ1ZPFc889pyXB8JBPoF5+wA8IDKchNgW+SghNz0ITA1MyMmYyN4RfAqGxTzyUU3AMUTntkXJC6fB7kHD6tcivdJKG0vhxkhZASA54kFgS+FovsWJjd1HGlSMnAgcrw11RLHA/smPmbmzqEgV0CcO0adOsG7VU+ZKIlr9K66hlA6Oe1BczCgBGkWC4ec3IXrjZCVF4KKBXAMxOlJD4RYlYFuEXTsrgtBQsDgNJ0JJpCloJm0/STEQU9bQoAE5Vo3T5bCJ8lRCankIMNhnztMoFIpwSunILULGiB72d07zdMJizPH6OHz9e3nj7F0UefOSRR/jXj/tyBd1vdU4fFi9m27uCbEtzhXIIspz5y894riUvvfTSxIkT7bKEONy6aNuJFSsz0oQXHDTow0GA+9RzXa40Nh6i/I74zDPPqL2Kmxpga5fEKpvstDic9c1LgrUFcfxGdMy2TYiQ/X7GjBk2Dvcii8D+JwVJ9iuHuuJNVZmBcJFVKGZaU/OMjZOGKMTyG6IuwaYenNoAm9ZnE6HZITS9gFksZjK9loP4y3zocPHjd9pbfRB0tYuL3Zx4xDoVUQFjgCujI4bQOqb6Qc47Kl+MHTvWk82jjz6qItlibWbKjnRxd8QvSH7g5VDpa2+TzXztvCAALqmWkeSgIX3I5y/6UIBHzGu/gUsgyssSv+g6Qzowm9TebBtz1nAEk50WnMczQRIVlwEIhRGV32OPPZZR3hEtJuvAxkYl85oRm5/DzG7duEtYW84H/GNSroCgc1F8ch3dKEaZ6IXgQaQhOrYmQrNDaG5BMlNMYL4cRNVig15K0ElU/D7u8GkIfj6VeQJpN2K2MOPUJVSsVWbVN+taRN20+EhcBcyKBtKFU3jcbQ+Di4oS+sYbb5iIZHNpgUJHQ/GDk68NgNOTE/kLA6IhKOqEo7+flrxOxOwCqTCY7rjjjvPk5CXM84VjrRJta1cenCHpwwRrwkQMCR2YQD04o4TK243UtDFbgnLOGop5TWoRU4Myxgob3YyC6AJ0ixbSFGh2CBsTSht6056ilKOQHd5u4bRmCJ0Qtcoj7cUSsUHQJaKumxLRq/eECRNuqP2TAXYdKx0Dg/kuig8hJjUdJECvTwBBwWleOA1x8hcinJ7oAZhJQxSVyZMnC497goLp5KVKi427geXoCmTBMUT4CSFTmwN5TIiqgEJJ5RGbrUHFlqmi6NPsZqESIRCcKw8tFkL6qU5a50M/G/m9wo1QcVMJuYnquiBOoa4c8rUx1fEARrKQZ7nJp+EAwnKAKACWwnJCMMQs6CRoAWZtAGLdTxE1C0DU6g0wBYQ0YBZz0QRDsAVCHzJRtAGKrYH2b8EzXLBlni4VWM34+c9/bnFQD8V2SAjA5nMlocVCyEibBO09oal+dhSa+bRJ0Jup/KV1srfBCLbeBoFhgLQAPJzFNYiAEIAIiFWRIMTqgmjD3fAccJNIxCcG0nwiGk4sHJBALIhJISCYJVaO01hy0PUGbiBRWnSvVGaXhSLn6EQ3bKawcQinc7LzsJxWq4wlRJfpDFxJaLEQskT1sLUwQyWklpMF1SG6aIwOd6OwWtkAbxA4FOQYDGSnsVr8uvjUymA/oqVAOKI2NyTYgh+OjSshAKc2JxMdLgCYSSAzFy1sQRePkBCc6AF6IXVbhdQp1JaJ0/ZhlOlMYXt2PiDc1qA+05n+xmKrqzPKV4MWCyGNacAF1KU6XAmCALr6BBagJWmf5y+fDQJmfmEbHmbnID718qmVUVVVFcN5P8BEZs/xR2/IiahLCwwkaC0vfiQTm+miJYcVnI7HQAIBBEAC4JhBjAoEHqIUGM8acE4IOaY2MFxhxuA3EaJZ9KKsJLRYCDmIitSirpZyrGUbhMd5lqKe0yBuCPAVgFEksJMXtPCgGEsasbmxPJXD0X1yn1HCjC5UPknwCShGE2ziJDPguvAQixmnLogW0US8bN4AOkSXXgAHgejCE0JcRWz2xJqLBETKkAPHZkaSbTcUQKQtNnJWEloshHSlIu1pRnUuoyicrlQMB0lBuIKDDdIg4A/XRC/cWJbbSDxfOf17v/aLuVu2gwMXBL/bt59ePQt4qHSOdz/hNV20IsfScU9wEyDhvPPO8/hur0L3Ou+h0rXStcdxw9izav/M5X3V7UVssJFDBy1lfAYRgqINgLPaEwGrLWXnz2DTUpI3MBiu11kG0ac2xq5k22IhFBVqAVpacRBAdaVfAKgL+vTpQ107JQafDYKooxuLE+B0J/PTo0eQ448/3mXxqKOO4nEPNF5zPLNhwM8vLpEeCoTA44vndQ9dZg85dPCw4HdXv+m4vI8aNcq2Tbh7nldTRM/QfkbA8Nvf/laMXYcI92uftSIepmCd1SCQcAOBeCBCgFn0Qhy//UxhXvrwA6KVZJQuuCE4o/UJfOpaSWixEDamB//musQSnrMcXh+4O7xmUev1/nLXXXd5XYMzPjyoy9J2wXeBkyu6fPIahL8A93mxNLUhiDhNbRQchZDwHU0CMdZVx7XPMQRIJpwyVUS99hnrExioXQ4INJEu4PjtkwI5Hl05PE9I3kNI7zCDsyI23I24AuALhQg/3x188MF2WanpOO7FxBpX/aSaos3FXto8l4TLLGoyDYGYUe76DFAVg24UF4ucIeTj1OIRPCdJDxEeAj2SeX9xKaIG8MOnU1iwGYgZ+DQFBBAIB5jdd02EHz0AMZD8ta0aQrbxAj+u2B45JC2UIyFX6xw9OMKbMreqVA60tkMPN+hCy4PYCIRocbpBSzi/fnTu3Nl03G0j1CVOUhyCmAuhTwNlnuuQi53ziEdRz99+zhQVY3fYYQcMwRYUOEQbEL1Bcamw+JR3XXQwHB34zB+0RghpH2bIJws//IjYIIgKZsbr5VYvai4AomV78yodFdWTtzOLjPSe6e1byDED8ZPiAmAWrhRFRD8mq8YQb9OWBaRByHVxPQZtTgdrjmRE0QIQGmoDghK41yjzOltZIiRocwODIR9ta4SQkSxhtr2du3l5BZboVYswSFmt5JM9DuJq5lVXXeXnCz/tOpJ45RFXGeMRmUyc/MXpHOcx08aGon6iqJCiaJfy4wYd0HFKRCph9onI6RaH+4CyrJB6njYFtbHdd999QhhsuRayHGBGoRKZtIUHhXA4NbR5gryHkCWAJVwmNpzC4ys2CQMvc7qMfOedd3jz3XffFX6uEQyV7eyzz/Yjn91x1113laNcw3FmgWATVz8lSsSddtpJjXU0NZ33a6/kFKAJ4dSgj1Fao5yJHHr9BilTJ02a5ADlVxFV0frw0o0hhBsLfAIytTnwiYfmKMSG/MaY8bQgtEYIqcsYwE4uCwSxMXB95AuOCGY/Hw4bNszhUNicFQVJYPjLz0O33367nz4IFJWohIZwvZ8POVGZtQhUUQw2V1sdmfBQw+xG4YeofmRi1ouC2c9Ytl5LxJMvBkO0ekHgFABB1MJDmnlJQLGGAoHHEEg+IO8hZIZ48LsMyFmC2JgxHBGXNs4KNt7hfb8bu87b3mShO6KA8ZGkvOyyy4jyST73YSbhhRdeMKNPv/n5tR1RygotCh1kpIDFKK2B77//vh8T7K9vvfWWSUXaWjnzzDM953pAwGOglkwtBi0KDSEBxNJHF4QyiCYlJxBdkDxB3kOY05vBbGNhjtIgwjWyQRiADBs5cuT1tX+2K4XUI6Tzi2cUF/wQWFZWJgZwm6ghHKd1K1eH8Y8YMcImaiJ5Kbmj6uLHjGguXjYWs4J58cUX77vvvg5QJNgR7YIePJ1QfGKmFf0hAK41l9bwXEsyooARC3T51AotnjxB3kPIhlCdJXZ77mA/PIgNthzBfv5ygvW71ZFHHilF/IjjgIqfgwTADUwrLTyeKYP4xUMvEDmXBFcLuB/iKWCgTU7mqZCIdACEhxpOKxSL6Er3ww8/nGRKOgd56MFPuBbk1p+5iM196oogkUmadNdLOFUhAEP+IO8hDNXZA1RI7uBKeNDrt3zH0YzX5UH86aefhvCLn5Hd1p0bDd9rr73cMTid650zBZtAwLOYhUfrd3YF3EBE51jFEy6lCEfhfRCzYDZWL92426lHOjoPWyXHHHOMa76I4tGKUwgPCZjRjc21El0FducxNYgubABPnqBVQ8iD3MQ7KzCGp/TykVzkBVvdp59+KmxdunSZOHGiU4Zz45133qnQ8QseNw2BxI8n/BsSxF6vtEC0NWIQaXtnpKxgGCWK5sLD9aTRjdN9eix96qmn3NCJEk7nVWx1AadPQ7SG5FpDZDxACajbG5QWb/MeQnYCejMmspCPfK4ApJch4scjkskbtP1PdhpiR+zVqxdcAOyLJ510kos8OkoMQTcQxSMOV8ozwZNYkkzAfOrytqAC+zQROqIhWgGLXqrabrER61h7yimnhM5GkYZHiwfA64I3P10k4xRmCB7LRVuXrWXxvIcw1A0b+FdO8EsQG2wxYJNA7Je1POKty0upn4q8q7nXq6iuGX5PcFTxOwMG/iJKnMaOHTt+/Hj3QmNVM8nk7Kq1EfIj8FMGaSTISFPgMQTltttuI4HT6SYjcbodHn300VLcLxgCHFMYgk04MbBI6xNYPQHGCjwKQAl+nD7zB60RQsaEARwHESRtY8D7/IiT5XyEGTib8Kafk+yCw4cPd7oRGF4WP37HLIHcx/1M6CbgdcZAm5/0laZeBhxSiMXjd6UTTjhh3LhxMURozzjjDAlnZyVHqPAoFaYWjDvuuOPEE088+eSTTz31VBOxYoMcmhEAABAASURBVHH5kiRJp1IFlMeTzaZSPpMklU1SqawpFHN7rdnJl9apVCpJdNW0Sd7+8h5C9ghJZVVlkkpmzp61YOGXTokWNbMahPAje/lIy3cAwsViqQV1kfBUKpWCYDPcQJ9aPoVo6aALjmi4AqsNQA/ELBhygAdeM1DIUqnFi8rFqCApTCeFSxYvTVIFxcWlKOmkoChVlEqy1VUZke3Vp7cjmOQjM5VKqdJJklBAmz/IewhZUuOIWguscTcw+5lFmqRSDUMNJ62Wh6qqTIMgFRqETCZpEBoUgtigEMQkk9Jmkmw2yVYn2Uwi5bJJkqqqhieZJJ3JppJaZbPZ6k6dNnCfqa6utlZSqVTSKn8mz+886XQhBxUWFCfZdMXi8i8++7Rn740T1qWKk6Q0m2qbTZUm8FRREpAUJgmt6oFFvkogXZikC5K0lMsKVk0E0+kkJXJZjssmBVU+CkrSBWnfPTbsOn361FiyqVQKQ0BBQUEg+WjT+RBaV2YqlbIqhVA9qays9nDcv2yzJGmbzayVza6fZDommc7ZGuiUzdRAknROko4NtNlOSXaDpBltlyQxpH6L2HQ5nWo13CDJgPWSLAidqU3JTrWqdqys7lRduVY21b6wqN2UqdOYH1nIdjhguzZPkPcQKi9JkkmnUkUSMUnefGvKRhtv0m3DQT377Lph72Hdeu3XtffwWjiwW6+DaqDPgV36HdCt7/Dl2s699u3Ye7/6bfd+B3QtO7B+27XPvp377Fe/rS8hKPUl1FD6HdClbEQN9D+wy4ADu/Yf3gVSVkPsWDZ87Z57dxswYt0N99mo7IBOG+8xaPD+623Q74PpcyJUEcXAc7GMz5ZtWyeEiUS0EtUTPwO1XWu9/gMG9d9sx7JNdy/bdI9+m+7Zr6aFDIP37r977/5De/ffo/f/b/tusmffTfbqW6/tXY8zKH0GDO0zYM/6bX0JQYlRy7cD9ujXb/c+/ffo03/3PmVDe5cN1fYp20tb1n9o2YC9+vSnFeLuG/Xcfped981k03M/+SwXIZEDYpmxLeeoLY2kW1rg8vKytouCgmWVlUk2ZROZ9Mqk6mxVr34DFlUkCysKFywtWbC0eMGyIjB/WSF84dI25RVtFlUs31ZUdVha1aF+u3BJ6aIlpfXbJZXtKyrb12/rSwhKfQko5YtLy5eULFlcXL64bXl5+yVgUbuatrztkop2S5e2W7yk3bLKtSuXtV1SnnTt2vW1V19avHBBUVERL4ic+AHIGh3CjJOLyDEpzHBFW1pRuX7HrplMSXWmtDpbUpUpDfBZlWmbSrVLpdomacj/azPOPtnS+m19zqBUZYqrq4vrt/UlBCVGLdcm6TY1kGqTqtGqXZJqn6TapRMIJdukC9ul0+0LC9cqLO6QLijp2q3z3LmzkyQbNwqREz+GQ8J2eD4g71mYKkgqq6rthZlszVE7W1XlkXOLTTef/8X89m3aF2ZLi5KSknSbzNKkKNsGzuxsOqkPzvYNQn3OoCQFqQahQSGIMWq5ljJJKpWkU6maNpukQSqbzqZS2aKSIvKrslWKyoIF84qKU2VlvZ959ulUOu3ulM1mha26ujpJCEDLo5/zKDqp/ctmkpSQWJyuValMkmSmT3+va9e1iwoXZSo/SWc/Lkw+KUx/Wpz+rCiZW5j9KJX5KF09dzWBJDM3yXyYVGtrFEvolpmTyszJJnMqFk/LVM1OJR+msh+u1b68XdslbUsr35/yepKqqrW79Zp8hzCdtQWmilMp0cumU5Zk8urLj/XauHTbwZ36l1VvuVnlNltVb7NlxbZbLx201ZeDBi7cbsv09gMLVxPYbsvCIVuWDtmqeMhW6VpIDR4EavDBA1PbbJEePDAZtEnl5v2XDRnUoUPbeVPfm5Ry3W+98NXMlO8QyjrhS5mq9naRpAuE8MV2pdltBm3Ua8N0n43T/XsXlvUs2qRvcb+e6b49C3r2SPfsXtSre9Hq0PbqVtSzB00KenanWKpnDy1IbdSjYEC/9v02KinrSe3S9ddestOOm86dM+3DOQtY2sqQ/xDWGpRNqrP+klSSTWZOnz175sz11i5duuTzpeWfLyuft+TLzyvLFy5duGBp+cLqpYsrK8urlpWvJm0lTZYtqfxfWFy5bFGNYpULFy+aP3/e3PIvP69atvDLBZ/269dv4sPPZb3QZFvJpbV+rWnyPl/aeVTwaozzwuiMUZjJFD726BN9e/dsU1pQXJQtLPD0WF1UWFhQmCouSmWTqlR2WTapXB3abLYymyzNJsuSbGWSqU5nqthQ+7mspDhF/8KCDBPWXqtk3XXXfvyJp5OkMJuka/zaiv/L+3y1EayuraLp6kw6m7gzFTww8aENe27Ypm1RYVHKMa+qOpukCjLpglRxYWFJurA0KSxJrQ5tcWm2uCRbUpKUFheCkuLi0qLCkuJ0cUkqla7q0L6kuGb9VfTu233Bok/feOsth+uk1f/yHsKCVDpbnalrV2lpG7/Cly+cP3funDkfTp81a+oHM6bMnAX5YPac6bNmTp41Y/Ksme+uJu3MWn20M2e8P4ue8TljyuR3Xv9o9rRZMybPmf1++7ZFU99/7+PZHyT/+bfHde3NN573EFZWVyXplHIqHVNJJpupXLZs0YJ5n7z6ygt9+3QfM/qi0aMumHDTVWOvPH/82AvHXH7e2NEXjB09cgVw3TWjxl11aY7h6rGXjL3yomvHX46iS+uzhuHKi+BXjbkYQK4Zd1nwwDHUtDFLLdv/fQaxTnv1FTXKjBk9csyVF4wec/6YK2k48uorLppw4/jLLj33yjEXjx1z+cAtNrv7ztuTTKaNnSD5f+s13/EjP+8hNEcdYF4NpJKqp55+bMi232jbtjhJKtN+fataok0llT4bhMLCbDpdrWtpxcLqKr+e13CmUlWZ6ooku2zZ0kW6avCksrgosUUV1DJnM0uBrspl5VWVi0koKUljMBCxRmbNNa4S3WcTYOl/eKqWViwqKKBSZrPN+6+zzlovT3qppKRoyWJq1DG3VdBWDuH/2XT//ff37dt3yJAhSB4ytMC5R9sgVFVVSeXogqRSNRcVSElJSRC1frJPpVJ+T/Y+Ul37MoKhsLBQFzCLT70Am4FkImLQYmgukGDgwQcfPGPGjNdff70gnz8KrkC3VRbCyZMnv/HGG0ceeSTluF7LHdoVQEQFA2dFsEXCKJ+IAeIRSJs2beB6xQmlqKhI/EgwBN1wYUaHa3VpmwuklZaW/uAHP7jttttMFAKbK2Tl+VdZCKl+7bXX7rvvvuuttx6cL7T/FURLMPgrOIWHH8UjPrUoWrBkyRJd+MXMp1ViFE4tHojg6QIQDM0FKShm3/rWt7p27XrvvfcSEtM1V87K86+yEBYXF991113MHjp0KEcLzH81ht9xYjNK265dOy2iqJDWtm1brU9RkVVrr702HCdf8y9OEEM6dOjQqVMnDNaN0FZUVIRYDE0HU2A+9NBDn3zyyVmzZvk0i+kQWxlWWQjZ/OWXX4riD3/4Q561P7Gc97UNAnej8ziAH3/88c8+++y77777i1/8QvgNXLx4MSHt27eX3O+8886DDz64zz77GIIo7SAdO3aUNIre22+/rYy//PLLfn++/PLLPayQiaFZIPADBgzYddddr7/+emsIWDHUaJaQFmFeZSHkWflx991377bbbhJIUWKPuGobBA5Cl2daIenevfvAgQP79OnTo0cPAZBG4b7y8nKUsrKy7bbbbq211sIswEZJu1NOOWXixImHHHKIsVKwW7du2E4++eTbb799+PDhOJsF9Bk8eHDnzp0feeQR8aOAFLS2miWkRZhXWQi5QNgeffRRPx9edNFFjOdrXqhvFe/oEiddAq9eCSGv+YRLPgxERQgltCjqQsfsUKML84QJE37605+iA/jpp58uWRVAn9bBuHHj5CjcYtLmgGR4SLbg4hMPBPHiiy8+7rjj5s2bxxYaWn9SE38rw6oMoeRg+fjx49U3OcHRjOcaAMmBuIpZ7nM5RJAwiCXQtWjRomAmnKMD32OPPSScGuv0v8suu/z4xz8Ws1/+8pcq7aRJk2SkZPrJT36y7rrrCjyVyBEPErSBU8lSMJH44aHqYYcdZiOQ1vilu3kpIJb4WxlWWQj5FzD71ltv/eyzz6QIB3EHL4DlvFCfkmOIIGnlXBCdViAkC4DcFeODDjoo/qGoy+hjjz1mloULF+IR0auuukoluOWWW+bMmRNE0dJlLPUMhwMK+ISIn9Di+dWvfnXTTTd99NFHpMXUiBj+K7Q4wyoLIRdb11zv9K+Q/vznP49SVtdCTgF1KfVxaaESSmKFzvletuEhWRtlTYn+5je/KQAcfc8996CbUVxRpI6iuvvuux9xxBFWEmVMp8VjPWGDiBAcIokNgZCz9957y13h1+vTRGbPxRtPa8IqCyG/KEf8xZt///vfp0yZcvbZZ/MCJ9a1XzYsR6nbC3egdfj0SmBjmz179uOPP77XXntZH4RHIMXY+cWnGZ1FdRkFfGrNLjAAg4kABF3aaUUoEDjdDMEPP//889V/m66MZILhAmmgT72tDKsshCznINZyjdbJ0NGgZ8+evCBsKAF8WvcziHVb2aBIam1IOOWKIbwJFzzJAUyEgm6gefHIMAwSFIIBLrQYBEwLcAK64deFQQlFwW/R0POaa67xaZVQ2CjgE5u2lWGVhZCdDGY5HzlGOpo/99xzNhg4z4YT9XK9FnNjIAXPqP0755xzfvOb3zgleq6ULvhljBhwOu9LFHJcLdDVz5haAYxPbJFG6KbGqTVEbwA1IIKt2lttbpPOMhjQow1+tmBrZVhlIeQsjmOtXFGR5NCZZ57pni5+1jW/6AK8yU2QxsAFn0NF7rLLLtOOHj36gw8+IER+kG+sQz/5XGxGmyXEjOgCTObmm29+wQUX2A6lptVjOoBHi0f+wXOBEWYpKIojR47ELKJ4LJEQBTeKzFaGZoeQc/kitKc04HEtCITNGHyyfwUmRXHDI0VIs6hffPFFG4xclCW8IAy5FhKiEMOh8iwoxuo1I8XIJA2CQpngxPDPf/4TxRBX+BgVnKTtv//+ls5DDz109dVXR8gRgyckRHgEjF2eY84666wTTzyRKJGTxOYFloteEAPNVR84BCdliMXpE6yAv76ExijNDiE7uYYBFALkskckKMcSn3B0WnIlQGkQQntsesk03Bq/9NJLfVrppuAguIm4j8wcP5nko+gFHEGI4RByUHAajhj6WBx/qf2vPEs+vyo47AgzTkM8srsOGgJcNhAhxmpBIJjhQk7shRde+MILL3gUJAqxuUAgc9jFY9RjBWiukPr8zQ4hEabXchnEImU55VjIrcCnYPhEpCvOBoH2AEN4xxCfaqBiqCRuvPHGRpFPoDKIjcdRAMlasyNCAIpPCIghWr0uiOKt9/nnn7/uuusEQ7l+4IEHnFrPO++8G2+8cdSoUY5CRqH84x//wEkHamsRSaBEu5ENAAAQAElEQVQbBMyfP/973/uekHsQoBIbEZsFkjvEGg7Mlclk6NksIQ0yf5UQ8ibXmJ6RYTCdxIBhNAtFTaY3h/tcDqKXGQCbgYSss846aqmj/x//+Ef8zAbm0qtFMQt+nHCINnB0OOB00jAbgsEOR0/boWdxV0AUebDDDju4wHz/+9+3NRryzDPP/OhHP/r000/hwEASIAHqHkTsDT/ppJM8oMNZjdgskHwk05ZwQE8AaVhIc6hfJYQcAdhGA2HTwsUVIjC61BlOhNCyMWUM1MW/hkAMR5EoYnb00UfvvPPOShx3s5woluvCxneGkC81p0+fPnfuXIg46Qo5OD/88EPPLgv+88dx0esBSBp5Envqqafw+JXDu8xpp52mtE6bVvPvOulPZ9NpDQEQWkE8xz/xxBOeVeEqM05Is8AQmtDfaiMTooU3S0iDzF8lhKGNnYa1hNqr+Dc+BYDZPqmrawUqEsIM/IQYgtkQ/GJgpdu0xo4dO2TIEDyIukTOglC3tcraFVdcIZl69eqFzfGHNMmBx9R+kdh666379+/vokIsIFMvxIY3YsSIPffcs2/fvn5nGDZsmFpqCl2WBSEQbegDNy8QZu87HkXj12lrBehtFrA0+E1kvRLrLkvPIK5M2+wQclNuPrj885uZt2OIZYXCxRh8UjrnC5TlINi4jz26YgXAIx5+APIC6QVLreNTLmMzZnmpDX6lz4yRE4gG4tGF8nntH6JPQCtEvhNgK0ZmkwPw44HIYwulrrbYDNSy7oQTTjjiiCNk9SeffGK9mlRXc8HUfBITUcDjwK9//WvnrObKqc/f7BByPQ0I4m4u4FwZ44VM9WMed/CXXiHRZfnDGwS96NzBNkEyijSjeI1kXc76fDpmzBhtLH9s6AAPZgj5BvILHJtWl6igW0Cm0GIwC4pWr1AxAV0vhM5GUdsoEjCHZAi6UX/4wx8cdvjaQBR1OyoBvFkQyltnJlIJ7r33Xj94NUtCY8yNhpANTAowmAYAwhL28zJ3cwqK3xlY5cHJD+J+NsLAUxj0UpccPFquCWlartESGKALA7b45FDDJdJRRx3ldyJ17IsvvhAnTsdgIH6AH0BkGCQAD8S8sc60GIJCn+iFoCOaSEgg6HSGAJqYiwTrxvF16tSpxx57LDqiqdluFB6UBgGPlUFPPHBgCHupwTNdunRxXrvjjju22morapg3hOjFCXzShAQ4YgDiCqDREBocw0ikgZZOKBATix/cTIoD0MWPfn5zNLe4jOUjNuPBrMWgNdaqZxJjfDYIDEO3Jgh34thvv/1cMyS69SuuuijDvBAYaiCuPJBJPs2pZy4CPRXZUP246EcomtPZpEB4sGFoEHDSygpgOM8AITfWECvSG4KnYHPpJQrCHDzsDc8g8gAJkAbl1yc2GkKqAIJMRigltKYMCkFczGYUKtI4zgv2G78cUXTbbbflCMpRkRz8MdCqF11sKA0CNvwWhOkMV8R++9vfSvFvfOMbNDGjuQzUpcWsbRHgRI4jX8AI9Orm4sHdDreIKDygZSyT6QZvEMIP1OMfQ4DgbbDBBvZ1R7AtttjCKAaywlqBMAqP3SQ845NRy4EhK4BGQ2itgRhJCUAuipBo0U3GZqALUWAQ6Q1xBHB2dzI0hK4M1rJcLx7gU9sgEEUyZhYSLpVdwwVSTXME4EG+ZrlZDDe1tkWAE3PquTJS3i3+vvvuMx0rqGRSiaJd8XTuoBhCMbbw1U477aQ4+UHUrdeypjmBlgUbsZkUWwAcmAJDDkhbMTQaQl42B3EhXUs6oEFMrCtEY2OhLp+iRTkIdc8991zXKe8sKBRiPyEQVmFoDEjTRRpOiJg5fPOpFxbXONJQ0FscZA+TLRrvqO5/hxxyyPXXX28ZmY7JobNeJtBNkq1YAX5gCEcdc8wx//rXv9QkSwRF+SHTWF2koRAuCznQFIRr4ejMBzijhRgCIP+B//3/RkMYgnARQSLzzGRWaUEPvbQEFLJOfUZEmUcnZqMY+N3vfldR9TuAuTETAqEoUSQ3CObiIGyEmIsczIqM7dCvSE8++aQTAaKxVoa2pUDpNunQoUMdPqWgOyX9Tc2nFKaSSZnAA1qUxuY1at1119VrTXjVc3jBLH7oRBlLjl6u4DcG+v1La2pzMVmL33T4AzBDtI1BoyGMARxqVq1PQSJaKTATis+ysjJHUO/3QUcUP4qKq16tuxQeVw4/5lGOEOZB8MAbBMaQw0IRMhchPq0MXvCrwssvvywdO3fubEbeXIGcBoWvgGg6G9WDDz7oR8c//elPrAasMITTA8dDExQmaBsE+qul7uwqv/d6StLfoqdwRUWFNmSGHAXmpZdesunI+5/97Gc2II8VQki+sOWgwYlyxEZDaCYiTI+Vp6yp7t279+vXT01TIUXlvdo/d/Bvf/vb9LaUsPE4O9kMDKSiLohjqiOJ6so8PCEWvUEQPxYyngLMxgxC7MEHH+wHQmZ7XjGWa7QtAtbiv//9b9dtB2CTAmLDCj4NnErMsSPQEKUx+M53vuPwst122xnu/cHbPU44wy0FEnxKAy2Pbbjhhp5+1Fu/dj388MNMA54A9daHGLscfUUhjCjyHQ8abE29+eabf/7zn/1IrkL26dOHWrKKRL7W4sEJMRAw2FOkuqRGIaqEfpSHYBYh6xGCH7AEQAAEkKzFoIWTbCDgAqfE999/3wbj11ppigiwRWteCPn8BckBOmJ8wiECY9lB1l9/fU9uKqffAuN5HQOBQC+VBIwm+FEoI7pEoVtAfgyBABoaBTFEwUBXMKwGGWap8wB7KY8HAyBNSyyinINzFzb+NJ0f3bTAdGQSjgEzBSDLQaMhJJcIMxFtjKO2M/GRRx7pxo1OKEUpBGxUZsITcxgIoZnYG6Uy+MXVynI9dx6xARColyMoxNFaAkkwFzvJaRCMMhcwncuijHnjjTdsXZglNzshWnLMCydWCwJBN6lPfoeby6RWgPgdeuihNFTHrE5FQpdZiGIjfgDBDBB1sS4kGG6noDMINmtCdF1npRGix3rrfrfddnOi5paQTBpmbByoBThJ1ip1qpq3eAsUTxOh0RAabzK68jLp9OY7E3gaFg+fPBVOUViw4QcQzBCaea2m2Wabbab6qXtSx9FGAdGFAZvhAgmxZpnHR+zU1SCYjvtCvtXq5wU71q233uoCTjFDqEFVEMHWIgI60BaYggSOQ2SaFvht8vLLL/fGK//89IGCh2IYAlAoTElLAfikJ5l6qYROZ+CTboJqrK2aXd26dfNMjwi8xUyZMoUONA8h1LOYSKOPIYha71D2qZkzZxquq4mwohBaFHQlzgTM4AJCX3zxRY9eNjamItIekSUMowSiIShehCm3ySabsNMnUQqvHcLdDhtH4zecZPIla3yiYG4Q2By9ZiSNO/wa5dbvEVVhp4BA6iINm5bj8NCZSvwLTIEo0ugQ9xMnI1ugU4xfMGhlXmNx6oXHwEBYQRRcL3ogVDKjqY1CIdZa/N3vfuf988QTT5TfAoaZsSZVhDiE5jERgYbQWSANV1F4Vf2Ux3xClN4mQqMhNLcJSCeIrlp+ER4Uevvtzc+kEAbYsfWCMJLe8MmTJ9uoqQuMYoPgeayaNGmSVa/iI3KH4aGu6XxiNrZBwEYfFvKvVDYXrRwBxMDPuSqVik0mj+SE4OEO/ARCeE0vISbiL7//8an8s1fxrLGmAMFPMZYaiCL2ZmRs8BCrizRdxOI3I4uowToHWpu0IcYivvXWW9aZKs0DkeXG6gJWOSIdbrnlFpsxfajn09Q0xNBEaDSEoRxV7F5mpS7RPtG1zFB5VHkXtY4dO5oMhU/NzR2KhoDdfPPNHojVFkNohkecaGmFSmWGeTOzLAyxTskEhGBrELChk0ZCeM0n3ZwazGXsK6+8svfee5uIc6lKFM/yOzbyTU09va6VTtR33XWXlxd76scff4whlh3ELIRDtIDV5EDIZwU/6CKHZEHFLKh+DnNMe+6555wV+vfvj580LU5XKY8yxtpibbc8Y7mgU0PrRiiKSsjhhx/u3CeD0Q0k01wYmgiNhpDebdu2zWazdCWX3uEOiM+Yw6btFcOProjmM7c1zjytFSdFqG7T+tvf/sbvGAwMpEePHgoOqyxAR2qB5CxdrMXWIIT7tNQwER6BMRfEdG5UouKqc+GFF4oWHnPpAtjw4zSFS9Ho0aO9nClZVhKXobOR+/ALPLuwGcV8ysCDojW1T0TyFQM8KjA5qrENlWRqGIWTHFEEuuyIVgwD/YxjkUH4iihTK55+GLjyyivxk2Y3EWMSKE9hlCZCoyFkkmm09IZoAe1Nz2agyxwfffSRtebC4KQqBsDFQ03za5/svPPOO90IlVxss2fPlkNUpB8z+M5J0mnQOpDKNjafBDYGBppab6jBU9zBoSi0Is3VytHGqrexqZN6dQFdnIJHF5/anj1aijR/EYVBF/dBTIGZZBOxTi9gqRboIgebPHZzd1twOvOO47oc/lEVicJj0VhSEyZMGDdu3P333+917cADD3TjVE5nzZoVzJa1tasaYTavcmJGUYebkRwTNREaDSHvMIa7aQ/RAtLNoUurCx2Y+K9//asLvpMq/ehEb+dPdXKHHXa44YYbNt10U77DYIicNoSK3CSQIRCb5wmuZ7biZh3gDAgcm09ONDXccBAWogD2E8tl/PLqq6/yr9rgBz88JnIypKFfHhxiHQ4tf8zUJjPkaEMICjNNZBTwKSSyhL3oIjdq1KgXXnjBI45VYs2h04eSes3lEqywQ8x16qmnOoe7ITigWl4OBw44MbtfnQ477DCuwEk+CVxhLloFoOhqIjQawiaOz7G5DHGf86EiOXLkSD92OyI76TBVtVS+/KxvrUmOww8/nMcN9KkFXMYeT3EMc09QcATjgAMOYLzEtSYYZghHA3gA3FjAYBSOhr/99tvnn3++dWAWS8rCdzOT5bxJE8UTM+CvADEICPnkQMihErfGFNtvv73fnmSMhUiCtLPdWgEUwyD2OFVRo+SllweXRZHbcssteeDGG280auDAgbY9T26c42TuhwtjzWs6o1YSWiyEfhJjtlclj2rqpyMW2+bOnauKOjLY7bnSumahX+AozTYGMx5RnIRTFC1JiH0F2z333GNDJeqkk07yDGuZcz2ZeIwyl09yInI+yVHKUObMmeNqrGB6r7IfK+mK2KBBg7ySy0vyuQ8Ig7FGiRkgmRBxhRCictBcbfjss89oQoiigo0aqq5WHZ4/fz5N/BpjK5GIRplOaFHgVqFPpvnFwzE1FrdPOuhSrmyo1MC5ktBiIbQX2oqURArJJ8vTcgvkkksusSNavF4LHZ1lid3IzdKJxgJ3fHX45g7O5VCBkbuSFYLiVw45bX8FFq/fDr3t9e7dWxcGc3G6Fs6zcBJ8Wg12XzcfybfjjjsqqgRyusuZLjjXC5g8MFA8ZIMrkPXHBM8Xnn5ee+01hcSyU/2EB7/QGki4s48AG5xEZAAACpNJREFUqBbKqUUgJI4kdHZ2Y7WzEgMVA7E31iJWEsghxFiLjObeOmwrZicHcSWhxUJon+Ap61SWaOnHHtnApxbm008/PXXqVAcK5dT5xRnajuIAaZQFzkHiFCc3DnUOYieEhfYbAhmpBAmnPcYoly0u5kF7pwO9rcXxQbFyTOejSC86CI9JpTL3+SQNA4+7hIiWs7SpxYlA10p7lfc/Z0s1UAabHRiiAIoTUSRIGso4kpjRHu84arhHPjucmmkh4j/55JMZ5ZHFXigLZbOx1lasGDLZ4qWeTIuJtj5XEloshBay3YKulAtFaUZFdL+Zue2OGDHCful2r6gyT0lBt2YVGY62qD3IKXeyU8iB4YzXEqgVBqKCIkjSS0R5SuzVZDVTnRQGoqQ1UdOmTbNuqCTYTjc2JAUcLi0wWEaONsqAYIiBYkCyNUeyUJmOAmyBiLpW8MQAjxUp3gwRb+cvj8Z6PWerLoS7OahDlrJzjW1CwZCahtBcS74yYDd10bI9y+bYQUlYGWixECo+fmSx69j56E1danGHhamiqi0crRgqrWom/3IKn7qNOLPYPFjIfrdj7rD/oRtuBajPEAtWa2WoZlIWyAbg01KA6AWCLcmURI9nxAqMNSGlVC2Zoay5hpuIVnwqHkqFsaQBCsMBORgAHq0HF+FH9CmodFCx1QkUu77V4KRmXzDvEUccIaFZagom42G7KkJ5c+H3LOVsbI0qyCFHsUFfSWiBEIYG1OIIu4IXCkUm3moZI3s4mrWOAxYyLyg+ftkRJPuHIS6/Quia7KlMFbIILFJZIjaOss6l4s1UQkzBxfzOm6IlY6wDhwI4sUQBCH8BRL4zRBhoCDcQEsCDYqYLGzkgcJ9OQ64lFpx5fSoeaql58WsNd7JVCW3McCcd1ZJkv3K4b7i6CKfgUcDUbNdFefurOs80dy1Kyj+uMJxW2pWEFgshPRjJF0qQC6942Cpc54POeOBAwfuOl4rM4MGDpYgF7lFY4l500UX8IuT2Fbmi8FrU5EhKh5eIH4EiqvDyqQVOMhCzaE0NuEaXeCCakRMhwILI4XhQAG8CocLpCV5srCRPnVzsQuI+LjDSS8WmGH5zCYxd2ZESm6i4BcoqhttfPTeKnJiRidPyMqm8NNx6tX+zPcCtIxAtsSsJLRZC7rO0gbTgQcFzEHUaVD1cpS1noIQyj95iKTzO4pglqMR1TrEtGcVslUq9ZbMLot+qOIVAHnHMc99wRLLnWdphOWnOQU5JPt977z17rfIrk+yR8kMZRAcUw+Oqo9AZ4hyEgc4nnHCC1DepM7N7re3A462N1rnGKrSMeN9c1CaEZGoARyEVgmnA44uusI6qhBNLoN3dycg6sE+zF0+eoMVCyEirW2WwTq1KlsgGtwih4jiedbKwMTBPSlmk2LgV4rcCxw1+dEpUY6WCJHjmmWcERjoynhzMnCse1113nXM/rxnrLGBNWNEQM3KQs4y00PKds4alYGq1znAUKrnvk+BIaQ9z0VYw1QOXP2NVb+csxxO/3SPaOBVGS5BReq0hBkJyQAeaW1ICLHLorMNmdju6Y4FnCjpIXyFXmTDkCVoshBzEABqLCmuVFG71CVH37I6scvS/6aabXJh04WcS4wEvOHFY7zYesRF450DeFzzLWS8vODc66bnqWQr2IWLlhGBrBVJB5n1p7RBvoxU8yepNQEp5DlWonSHp4ElW/Bx2vC/LeCrxuzKgWnqacFykgJOqdLQsLDXHSzkEz5lGZ2AhUoAVNGQsBNGy88uMhejyaonIS3TWWQQQDHmCFguhyLGZumwTOQCxx7CWGbTXOoh78nDU5lynU0PEgHkQYZBwnCWEjpReWQ20ewmegcTabGShcDqvW+nYBEbLua4Q9hvet0thcG1Qh01tHSjRvOzcJKu01BBdmx+ileQyZ7gSKktszHrFUgH8/e9/H7MPHz7c+7tVIk7MsewMJJmlBlKMhhaotHP6lbJ+gHOEVhgorDcHxhKeJ2ixEDJPMABFaQxQAFOFQctsn8D9yUHcKd/hzQnFHV8IbYoGcpxW+CWHIRynBUbdcccdsoRrZFvMIvzo+IVEgCWWQ6+5lGI3QjJ12bFMhM6t5hLdnXfeWWl1bDGXrc6BxdOXzFNIrQn7t/ulpWAsE6wA2x6c8pSBiBl9ZBhmwZbW7gl2AWXAjOh6LSzBo5v1ZBajdGnzBC0WQgZTkXMBg/laywzL1lYExwDYho1h1rubgzxQeWxUFr4rM/slIgYeF0hsBhIIVD9nBy5WTr1XcQoiTmC7FZi4jIolgeKhdeh1knJKooa0djhCdz7af//9LRGnFXP55chNwLzkOyU5QNos7dz0FAnCRY7+ElHwGKUgW38y3rlagloBkpsmgLaOAjHQjDQ01hDChZaoPEGLhZANtFdktJRmA6C0sAmGJLMk4YBtuqSUXo9SWk9l3rqGDRvGj46IypG6Knh8RywGQyDcYbhQ2bdI4DKf3OS9Q54RBXHlwO9l2XFUfbM/qbGkOX0Ij41NhJRZW6xf7f2uSYgF5Mcgi0YGmwISwSPHpIhm9Ou0Y45qqd46PMtjbMYySjHAxmoK0wfQFkBI0OriFnieoMVCSGluBRSFawEEhQ2LFy/mazjgoBzOEUHRIjpiOHQ4FAiJHPJ7BY/LHk4kjb+sBqcPArkGhShTiDQwXC8/CoNVL8mApYPTEGyCIcyGYJBVhGAzJOSIBMQnZtJkpDqpNii522yzjTA7FjnuGisehABJbFKtSelvIi3QRVQAHCDGZz7aFgthSyknTmyWo7bMm2++2RHUYdXt3g7nSsCPskc1k1gcZ1L8YgPkhJAAYQC6yAmAAy4GwaBOwNU9BxlzOdqo6qZTA+zQ0lQdNp3Mc3RyYBFvQ9RS04mHsQSuJrDahZBbxUZpEgYAsdIdI70jSws+dUp0QrGlqWlO/5zu0dw5Pk4lqqXbmIcepyTgqgdXTh1wgDjJcrupy4Zfgw866CD3Cu9Bji3qrS2WEBO5eFBDzCwLCH3EDECkoHCuJsELNVa7EFKLs7iJv7QKIIpk4jv0cCuKvPF8I0L2PMcc7wAuKg6rfpxz41ZCXemAgz4QJ7kFnHoUZwdIv8LbL93u5bqASUTCrRhJJqEhlo5ZgE+JK/MoQwcAoY+u1QRWuxCGy8KD3MpN3BeR41nuk5RAaHmWx/ViDsAGsAGbFrAOcIYcfg9mLbYAA30CnAFGAbi5zG4uCAb82pwQXasJrHYhdJSIlc7vgJu0wsCtXBke5EpEFP7VgvA4NnRgVAB+gF+oAgwhH+SGBKcIATyYDUEkDQ8kJ1BXXQZdqwOsdiEMN/GmTNLyZriS74De8Bq3BiCCYBNjTgeCigKWYyaKhAC9AK4FRkV06/IYLtfJR8RAPiTm1bWawGoXQj7iqYC6zhIVRF4TVz7l+uhFBEYJA7rAc7pjCBxgQzcKMx7gs0HAjI6BNAAxCsW8wCccD0AXTu1qAqtdCDkd8BcH8bsWjgLgXMl9XKwLpS5gQ9SFIZyOGQUYCDAAn3UBTwCi3roCDdGlDaJen+TjREFfTWC1CuFq4pM1TI2vQ7iGBay+ul+HsL5P1jDK1yFcwwJWX92vQ1jfJ2sY5X8AAAD//5gEthYAAAAGSURBVAMA+NFGRK5pZysAAAAASUVORK5CYII=";

function buildSummaryForPDF(log) {
  const count = (equipo, accion, resultado) =>
    log.filter(e => e.equipo===equipo && e.accion===accion && (resultado ? e.resultado===resultado : true)).length;
  return [
    { label:"Line Ganados",       propio: count("Propio","Line","Ganado"),              rival: count("Rival","Line","Ganado") },
    { label:"Line Perdidos",      propio: count("Propio","Line","Perdido"),             rival: count("Rival","Line","Perdido") },
    { label:"Scrum Ganados",      propio: count("Propio","Scrum","Ganado"),             rival: count("Rival","Scrum","Ganado") },
    { label:"Scrum Perdidos",     propio: count("Propio","Scrum","Perdido"),            rival: count("Rival","Scrum","Perdido") },
    { label:"Tackles Efectivos",  propio: count("Propio","Tackle","Efectivo"),          rival: count("Rival","Tackle","Efectivo") },
    { label:"Tackles Fallidos",   propio: count("Propio","Tackle","Fallido"),           rival: count("Rival","Tackle","Fallido") },
    { label:"Penales Cometidos",  propio: count("Propio","Penal","Cometido"),           rival: count("Rival","Penal","Cometido") },
    { label:"Errores de Manejo",  propio: count("Propio","Error_de_manejo","Error"),    rival: count("Rival","Error_de_manejo","Error") },
    { label:"Quiebres",           propio: count("Propio","Quiebre","Hecho"),            rival: count("Rival","Quiebre","Hecho") },
    { label:"Rucks < 3s",         propio: count("Propio","Ruck","Menos 3"),             rival: count("Rival","Ruck","Menos 3") },
    { label:"Rucks > 3s",         propio: count("Propio","Ruck","Mas 3"),               rival: count("Rival","Ruck","Mas 3") },
    { label:"Salidas dentro 22",  propio: count("Propio","Salidas","Dentro de las 22"), rival: count("Rival","Salidas","Dentro de las 22") },
    { label:"Salidas fuera 22",   propio: count("Propio","Salidas","Fuera de las 22"),  rival: count("Rival","Salidas","Fuera de las 22") },
    { label:"Salidas Cortas",     propio: count("Propio","Salidas","Cortas"),           rival: count("Rival","Salidas","Cortas") },
    { label:"Salidas Largas",     propio: count("Propio","Salidas","Largas"),           rival: count("Rival","Salidas","Largas") },
  ];
}

function exportMatchPDF(match) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; const margin = 14; let y = 14;

  // Header
  doc.addImage(LOGO_B64, "PNG", margin, y, 22, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16); doc.setTextColor(0, 100, 60);
  doc.text("SAN MIGUEL RUGBY & HOCKEY CLUB", margin + 26, y + 8);
  doc.setFontSize(10); doc.setTextColor(80,80,80);
  doc.text("Análisis de Partido — Staff Técnico", margin + 26, y + 15);
  y += 26;
  doc.setDrawColor(0,150,90); doc.setLineWidth(0.8);
  doc.line(margin, y, W - margin, y); y += 8;

  // Datos del partido
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(0,100,60);
  doc.text("DATOS DEL PARTIDO", margin, y); y += 6;
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(40,40,40);
  const c2 = W/2+5;
  doc.setFont("helvetica","bold"); doc.text("Fecha:", margin, y);
  doc.setFont("helvetica","normal"); doc.text(match.date||"—", margin+22, y);
  doc.setFont("helvetica","bold"); doc.text("Rival:", c2, y);
  doc.setFont("helvetica","normal"); doc.text(match.rival||"—", c2+18, y); y+=6;
  doc.setFont("helvetica","bold"); doc.text("Sede:", margin, y);
  doc.setFont("helvetica","normal"); doc.text(match.location||"—", margin+22, y);
  doc.setFont("helvetica","bold"); doc.text("Competencia:", c2, y);
  doc.setFont("helvetica","normal"); doc.text(match.competition||"—", c2+36, y); y+=8;

  // Marcador
  doc.setFillColor(10,30,10);
  doc.roundedRect(margin, y, W-margin*2, 22, 4, 4, "F");
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(0,200,120);
  doc.text("NUESTRO EQUIPO", margin+22, y+6, {align:"center"});
  doc.text((match.rival||"RIVAL").toUpperCase(), W-margin-22, y+6, {align:"center"});
  doc.setFontSize(22); doc.setTextColor(255,255,255);
  doc.text(String(match.score?.us??0), margin+22, y+17, {align:"center"});
  doc.text(String(match.score?.them??0), W-margin-22, y+17, {align:"center"});
  doc.setFontSize(14); doc.setTextColor(100,160,100);
  doc.text("—", W/2, y+17, {align:"center"}); y+=30;

  // Análisis táctico
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(0,100,60);
  doc.text("ANÁLISIS TÁCTICO", margin, y); y+=4;
  const summary = buildSummaryForPDF(match.log||[]);
  autoTable(doc, {
    startY: y,
    head: [["Estadística","Propio","Rival"]],
    body: summary.map(r => [r.label, String(r.propio), String(r.rival)]),
    margin: {left:margin, right:margin},
    styles: {fontSize:9, cellPadding:2.5, textColor:[30,30,30]},
    headStyles: {fillColor:[0,100,60], textColor:[255,255,255], fontStyle:"bold", halign:"center"},
    columnStyles: {
      0: {cellWidth:100},
      1: {halign:"center", cellWidth:30, textColor:[0,130,70], fontStyle:"bold"},
      2: {halign:"center", cellWidth:30, textColor:[180,50,50], fontStyle:"bold"},
    },
    alternateRowStyles: {fillColor:[240,248,242]},
  });
  y = doc.lastAutoTable.finalY + 8;

  // Jugadores
  const players = (match.players||[]).filter(p => p.name || (p.tries||0)+(p.conversions||0)+(p.penalties||0)+(p.dropGoals||0) > 0);
  if (players.length > 0) {
    if (y > 230) { doc.addPage(); y = 14; }
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(0,100,60);
    doc.text("PUNTOS POR JUGADOR", margin, y); y+=4;
    autoTable(doc, {
      startY: y,
      head: [["Jugador","Tries","Conv.","Penales","Drop","Pts","Min"]],
      body: players.map(p => [
        "#"+p.id+" "+(p.name||"—"),
        p.tries||"—", p.conversions||"—", p.penalties||"—", p.dropGoals||"—",
        (p.tries*5+p.conversions*2+p.penalties*3+p.dropGoals*3)||"—",
        (p.minutesPlayed||0)+"'"
      ]),
      margin: {left:margin, right:margin},
      styles: {fontSize:9, cellPadding:2.5},
      headStyles: {fillColor:[0,100,60], textColor:[255,255,255], fontStyle:"bold", halign:"center"},
      columnStyles: {
        0:{cellWidth:65}, 1:{halign:"center"}, 2:{halign:"center"},
        3:{halign:"center"}, 4:{halign:"center"},
        5:{halign:"center", fontStyle:"bold", textColor:[180,130,0]},
        6:{halign:"center", textColor:[120,120,120]},
      },
      alternateRowStyles: {fillColor:[240,248,242]},
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Notas
  if (match.notes) {
    if (y > 250) { doc.addPage(); y = 14; }
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(0,100,60);
    doc.text("NOTAS DEL CUERPO TÉCNICO", margin, y); y+=5;
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(60,60,60);
    const lines = doc.splitTextToSize(match.notes, W-margin*2);
    doc.text(lines, margin, y);
  }

  // Footer
  const pH = doc.internal.pageSize.height;
  doc.setDrawColor(0,150,90); doc.setLineWidth(0.4);
  doc.line(margin, pH-12, W-margin, pH-12);
  doc.setFont("helvetica","italic"); doc.setFontSize(8); doc.setTextColor(150,150,150);
  doc.text("San Miguel Rugby & Hockey Club — Staff Técnico", margin, pH-7);
  doc.text("Generado el "+new Date().toLocaleDateString("es-AR"), W-margin, pH-7, {align:"right"});

  const fileName = "SMRHC_"+(match.rival||"Partido").replace(/\s+/g,"_")+"_"+(match.date||"sin_fecha")+".pdf";
  doc.save(fileName);
}

// ─── FIREBASE CONFIG ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyB22Jcrd7FVjaDAXvBF40s5TtGIrCDtuCk",
  authDomain: "smrhc-stats.firebaseapp.com",
  projectId: "smrhc-stats",
  storageBucket: "smrhc-stats.firebasestorage.app",
  messagingSenderId: "3330947459",
  appId: "1:3330947459:web:512c978ad867586e4fdeb6",
  measurementId: "G-5TJHH6ETHS"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// ─── DATA CONFIG ─────────────────────────────────────────────────────────────

const ACCIONES = {
  Tackle:           { icon: "💪", resultados: ["Efectivo", "Fallido"] },
  Line:             { icon: "✋", resultados: ["Ganado", "Perdido"] },
  Scrum:            { icon: "🔄", resultados: ["Ganado", "Perdido"] },
  Error_de_manejo:  { icon: "❌", resultados: ["Error"] },
  Penal:            { icon: "⚡", resultados: ["Cometido"] },
  Quiebre:          { icon: "💥", resultados: ["Hecho"] },
  Ruck:             { icon: "🏉", resultados: ["Menos 3", "Mas 3"] },
  Salidas:          { icon: "📤", resultados: ["Dentro de las 22", "Fuera de las 22", "Cortas", "Largas"] },
};

const POSICIONES = [
  "1 - Pilier izq.","2 - Hooker","3 - Pilier der.",
  "4 - Lock","5 - Lock","6 - Ala","7 - Ala","8 - Octavo",
  "9 - Medio scrum","10 - Apertura","11 - Ala izq.",
  "12 - Centro","13 - Centro","14 - Ala der.","15 - Full back",
  "16 - Suplente","17 - Suplente","18 - Suplente","19 - Suplente",
  "20 - Suplente","21 - Suplente","22 - Suplente","23 - Suplente",
];

const STATS_JUGADOR = [
  { key:"tries",       label:"Tries",           icon:"🏉", pts:5 },
  { key:"conversions", label:"Conversiones",     icon:"🎯", pts:2 },
  { key:"penalties",   label:"Penales",          icon:"⚡", pts:3 },
  { key:"dropGoals",   label:"Drop Goals",       icon:"💫", pts:3 },
  { key:"tackles",     label:"Tackles",          icon:"💪", pts:0 },
  { key:"carries",     label:"Cargas",           icon:"🏃", pts:0 },
  { key:"yellowCards", label:"Tarjeta Amarilla", icon:"🟡", pts:0 },
  { key:"redCards",    label:"Tarjeta Roja",     icon:"🔴", pts:0 },
];

const initPlayer = (n) => ({
  id: n, name: "", position: POSICIONES[n-1] || `Jugador ${n}`,
  tries:0, conversions:0, penalties:0, dropGoals:0,
  tackles:0, carries:0, yellowCards:0, redCards:0, minutesPlayed:80,
});

const initMatch = () => ({
  date: new Date().toISOString().split("T")[0],
  rival: "", location: "Local", competition: "", notes: "",
  score: { us:0, them:0 },
  players: Array.from({length:23}, (_,i) => initPlayer(i+1)),
  log: [],
});

const calcPts = (p) => p.tries*5 + p.conversions*2 + p.penalties*3 + p.dropGoals*3;

function buildSummary(log, tiempo = null) {
  const rows = tiempo ? log.filter(e => e.tiempo === tiempo) : log;
  const count = (equipo, accion, resultado) =>
    rows.filter(e => e.equipo===equipo && e.accion===accion && (resultado ? e.resultado===resultado : true)).length;
  const pct = (a, b) => { const t = a + b; return t === 0 ? null : Math.round((a/t)*100); };
  return [
    { label:"Line Ganados",      propio: count("Propio","Line","Ganado"),           rival: count("Rival","Line","Ganado"),           type:"pos" },
    { label:"Line Perdidos",     propio: count("Propio","Line","Perdido"),          rival: count("Rival","Line","Perdido"),          type:"neg" },
    { label:"Scrum Ganados",     propio: count("Propio","Scrum","Ganado"),          rival: count("Rival","Scrum","Ganado"),          type:"pos" },
    { label:"Scrum Perdidos",    propio: count("Propio","Scrum","Perdido"),         rival: count("Rival","Scrum","Perdido"),         type:"neg" },
    { label:"Tackles Efectivos", propio: count("Propio","Tackle","Efectivo"),       rival: count("Rival","Tackle","Efectivo"),       type:"pos" },
    { label:"Tackles Fallidos",  propio: count("Propio","Tackle","Fallido"),        rival: count("Rival","Tackle","Fallido"),        type:"neg" },
    { label:"Penales Cometidos", propio: count("Propio","Penal","Cometido"),        rival: count("Rival","Penal","Cometido"),        type:"neg" },
    { label:"Errores de Manejo", propio: count("Propio","Error_de_manejo","Error"), rival: count("Rival","Error_de_manejo","Error"), type:"neg" },
    { label:"Quiebres",          propio: count("Propio","Quiebre","Hecho"),         rival: count("Rival","Quiebre","Hecho"),         type:"pos" },
    { label:"Rucks < 3s",        propio: count("Propio","Ruck","Menos 3"),          rival: count("Rival","Ruck","Menos 3"),          type:"pos" },
    { label:"Rucks > 3s",        propio: count("Propio","Ruck","Mas 3"),            rival: count("Rival","Ruck","Mas 3"),            type:"neg" },
    { label:"Salidas ≤22",       propio: count("Propio","Salidas","Dentro de las 22"), rival: count("Rival","Salidas","Dentro de las 22"), type:"neg" },
    { label:"Salidas >22",       propio: count("Propio","Salidas","Fuera de las 22"),  rival: count("Rival","Salidas","Fuera de las 22"),  type:"pos" },
    { label:"Salidas Cortas",    propio: count("Propio","Salidas","Cortas"),        rival: count("Rival","Salidas","Cortas"),        type:"neu" },
    { label:"Salidas Largas",    propio: count("Propio","Salidas","Largas"),        rival: count("Rival","Salidas","Largas"),        type:"neu" },
  ].map(r => ({ ...r, pct: r.type==="pos" ? pct(r.propio, r.propio+r.rival) : r.type==="neg" ? pct(r.rival, r.propio+r.rival) : null }));
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Completá todos los campos."); return; }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch(e) {
      setError("Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.loginRoot}>
      <div style={S.loginCard}>
        <div style={S.loginLogo}>
          <span style={{fontSize:40}}>🏉</span>
          <div style={S.loginTitle}>RUGBY<span style={S.loginAccent}>STATS</span></div>
          <div style={S.loginSubtitle}>SMRHC — Staff Técnico</div>
        </div>
        <div style={S.loginForm}>
          <label style={S.loginLabel}>Email
            <input style={S.loginInput} type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </label>
          <label style={S.loginLabel}>Contraseña
            <input style={S.loginInput} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </label>
          {error && <div style={S.loginError}>{error}</div>}
          <button style={{...S.loginBtn, opacity: loading?0.7:1}} onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

const SECTIONS = ["Partido","Registro","Jugadores","Resumen"];

export default function App() {
  const [user, setUser]                 = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [match, setMatch]               = useState(initMatch());
  const [section, setSection]           = useState(0);
  const [matches, setMatches]           = useState([]);
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [logForm, setLogForm]           = useState({ minuto:"", tiempo:"1T", equipo:"Propio", accion:"Tackle", resultado:"Efectivo", jugador:"", penalizacion:"", tarjeta:"", obs:"" });
  const [selPlayer, setSelPlayer]       = useState(null);
  const [resTab, setResTab]             = useState("total");
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  // ── Auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  // ── Cargar partidos ──
  useEffect(() => {
    if (!user) return;
    const fetchMatches = async () => {
      try {
        const snapshot = await getDocs(collection(db, "partidos"));
        const data = snapshot.docs.map(d => ({ ...d.data(), firebaseId: d.id }));
        data.sort((a,b) => new Date(b.date) - new Date(a.date));
        setMatches(data);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchMatches();
  }, [user]);

  const updateMatch  = (k,v) => setMatch(m => ({...m,[k]:v}));
  const updatePlayer = (id,k,v) => setMatch(m => ({...m, players: m.players.map(p => p.id===id ? {...p,[k]:v} : p)}));

  const ACCIONES_CON_JUGADOR = ["Tackle", "Error_de_manejo", "Penal"];
  const requiereJugador = ACCIONES_CON_JUGADOR.includes(logForm.accion) && logForm.equipo === "Propio";

  const addLog = () => {
    if (!logForm.accion) return;
    if (requiereJugador && !logForm.jugador) return;
    setMatch(m => ({...m, log: [...m.log, {...logForm, id: Date.now()}]}));
    setLogForm(f => ({...f, minuto:"", obs:"", penalizacion:"", tarjeta:"", jugador:""}));
  };
  const removeLog = (id) => setMatch(m => ({...m, log: m.log.filter(e => e.id!==id)}));

  const saveMatch = async () => {
    setSaving(true);
    try {
      const data = { ...match, savedAt: new Date().toLocaleString(), savedBy: user.email };
      if (editingId) {
        await updateDoc(doc(db, "partidos", editingId), data);
        setMatches(prev => prev.map(m => m.firebaseId === editingId ? { ...data, firebaseId: editingId } : m));
        setEditingId(null);
        showToast("✅ Partido actualizado");
      } else {
        const ref = await addDoc(collection(db, "partidos"), data);
        setMatches(prev => [{ ...data, firebaseId: ref.id }, ...prev]);
        showToast("✅ Partido guardado");
      }
      setMatch(initMatch());
      setSection(0);
    } catch(e) { showToast("❌ Error al guardar", "error"); }
    finally { setSaving(false); }
  };

  const deleteMatch = async (firebaseId) => {
    try {
      await deleteDoc(doc(db, "partidos", firebaseId));
      setMatches(prev => prev.filter(m => m.firebaseId !== firebaseId));
      setConfirmDelete(null);
      showToast("🗑 Partido borrado");
    } catch(e) { showToast("❌ Error al borrar", "error"); }
  };

  const editMatch = (m) => { setMatch(m); setEditingId(m.firebaseId); setHistoryOpen(false); setSection(0); setSelPlayer(null); };

  const summary       = useMemo(() => buildSummary(match.log),       [match.log]);
  const summary1T     = useMemo(() => buildSummary(match.log,"1T"),  [match.log]);
  const summary2T     = useMemo(() => buildSummary(match.log,"2T"),  [match.log]);
  const activeSummary = resTab==="1T" ? summary1T : resTab==="2T" ? summary2T : summary;
  const selPlayerData = match.players.find(p => p.id === selPlayer);

  if (authLoading) return <div style={{...S.root, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#4a6a4a"}}>Cargando...</div>;
  if (!user) return <LoginScreen />;

  if (historyOpen) return (
    <div style={S.root}>
      <Header user={user}>
        <button style={S.pill} onClick={() => { setHistoryOpen(false); setConfirmDelete(null); }}>← Volver</button>
      </Header>
      <div style={S.page}>
        <div style={S.pageTitle}>Historial ({matches.length} partidos)</div>
        {loading && <div style={S.empty}>Cargando partidos...</div>}
        {!loading && matches.length === 0 && <div style={S.empty}>No hay partidos guardados todavía.</div>}
        {matches.map((m,i) => (
          <div key={m.firebaseId||i} style={S.histCard}>
            <div style={S.histTop}>
              <span style={S.histRival}>vs {m.rival||"Rival"}</span>
              <span style={S.histDate}>{m.date}</span>
            </div>
            <div style={S.histScoreRow}>
              <span style={S.histScore}>{m.score?.us ?? 0}</span>
              <span style={S.histDash}>—</span>
              <span style={S.histScore}>{m.score?.them ?? 0}</span>
            </div>
            <div style={S.histMeta}>{m.location}{m.competition ? ` · ${m.competition}`:""} · {m.log?.length||0} acciones · {m.savedAt}</div>
            {m.savedBy && <div style={{fontSize:11, color:"#3a5a3a", marginTop:4}}>Guardado por: {m.savedBy}</div>}
            {confirmDelete === m.firebaseId ? (
              <div style={S.histConfirm}>
                <span style={S.histConfirmText}>¿Seguro que querés borrar este partido?</span>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button style={S.histBtnDanger} onClick={() => deleteMatch(m.firebaseId)}>Sí, borrar</button>
                  <button style={S.histBtnCancel} onClick={() => setConfirmDelete(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={S.histActions}>
                <button style={S.histBtnEdit} onClick={() => editMatch(m)}>✏️ Editar</button>
                <button style={S.histBtnDelete} onClick={() => setConfirmDelete(m.firebaseId)}>🗑 Borrar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      {toast && <div style={{...S.toast, background: toast.type==="error"?"#4a1a1a":"#1a3a1a"}}>{toast.msg}</div>}
      <Header user={user}>
        <button style={S.pill} onClick={() => setHistoryOpen(true)}>Historial ({matches.length})</button>
        <button style={S.pillGreen} onClick={() => { setMatch(initMatch()); setSection(0); setSelPlayer(null); setEditingId(null); }}>+ Nuevo</button>
      </Header>

      <div style={S.scoreboard}>
        <div style={S.scoreTeam}>
          <div style={S.scoreLabel}>Nuestro equipo</div>
          <div style={S.scoreCtrl}>
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,us:Math.max(0,match.score.us-1)})}>−</button>
            <input
              style={S.scoreInput}
              type="number" min="0"
              value={match.score.us}
              onChange={e => updateMatch("score",{...match.score,us:Math.max(0,parseInt(e.target.value)||0)})}
            />
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,us:match.score.us+1})}>+</button>
          </div>
        </div>
        <div style={S.scoreCenter}>
          <div style={S.scoreVS}>VS</div>
          <div style={S.scoreInfo}>{match.date}</div>
          {match.rival && <div style={S.scoreInfo2}>{match.rival}</div>}
        </div>
        <div style={S.scoreTeam}>
          <div style={S.scoreLabel}>{match.rival||"Rival"}</div>
          <div style={S.scoreCtrl}>
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,them:Math.max(0,match.score.them-1)})}>−</button>
            <input
              style={S.scoreInput}
              type="number" min="0"
              value={match.score.them}
              onChange={e => updateMatch("score",{...match.score,them:Math.max(0,parseInt(e.target.value)||0)})}
            />
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,them:match.score.them+1})}>+</button>
          </div>
        </div>
      </div>

      {editingId && <div style={S.editingBanner}>✏️ Estás editando un partido guardado — recordá guardar los cambios en Resumen</div>}

      <div style={S.nav}>
        {SECTIONS.map((s,i) => (
          <button key={s} style={{...S.navBtn,...(section===i?S.navBtnActive:{})}} onClick={() => { setSection(i); setSelPlayer(null); }}>{s}</button>
        ))}
      </div>

      {section === 0 && (
        <div style={S.page}>
          <div style={S.pageTitle}>Datos del Partido</div>
          <div style={S.grid2}>
            <Field label="Fecha"><input style={S.input} type="date" value={match.date} onChange={e=>updateMatch("date",e.target.value)}/></Field>
            <Field label="Rival"><input style={S.input} placeholder="Nombre del rival" value={match.rival} onChange={e=>updateMatch("rival",e.target.value)}/></Field>
            <Field label="Sede">
              <select style={S.input} value={match.location} onChange={e=>updateMatch("location",e.target.value)}>
                <option>Local</option><option>Visitante</option><option>Cancha neutral</option>
              </select>
            </Field>
            <Field label="Competencia"><input style={S.input} placeholder="Ej: Liga provincial" value={match.competition} onChange={e=>updateMatch("competition",e.target.value)}/></Field>
          </div>
          <Field label="Notas del cuerpo técnico" style={{marginTop:12}}>
            <textarea style={{...S.input,minHeight:90,resize:"vertical"}} placeholder="Observaciones generales del partido..." value={match.notes} onChange={e=>updateMatch("notes",e.target.value)}/>
          </Field>
        </div>
      )}

      {section === 1 && (
        <div style={S.page}>
          <div style={S.pageTitle}>Registro de Acciones</div>
          <div style={S.logForm}>
            <div style={S.logFormRow}>
              <Field label="Min." style={{width:60}}>
                <input style={{...S.input,textAlign:"center"}} placeholder="—" value={logForm.minuto} onChange={e=>setLogForm(f=>({...f,minuto:e.target.value}))}/>
              </Field>
              <Field label="Tiempo">
                <div style={S.segCtrl}>
                  {["1T","2T"].map(t => <button key={t} style={{...S.segBtn,...(logForm.tiempo===t?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,tiempo:t}))}>{t}</button>)}
                </div>
              </Field>
              <Field label="Equipo">
                <div style={S.segCtrl}>
                  {["Propio","Rival"].map(eq => <button key={eq} style={{...S.segBtn,...(logForm.equipo===eq?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,equipo:eq,jugador:""}))}>{eq}</button>)}
                </div>
              </Field>
            </div>
            <Field label="Acción">
              <div style={S.accionGrid}>
                {Object.entries(ACCIONES).map(([key,{icon}]) => (
                  <button key={key} style={{...S.accionBtn,...(logForm.accion===key?S.accionBtnActive:{})}}
                    onClick={()=>setLogForm(f=>({...f,accion:key,resultado:ACCIONES[key].resultados[0],jugador:""}))}>
                    <span style={{fontSize:16}}>{icon}</span>
                    <span style={{fontSize:11,marginTop:2}}>{key.replace("_"," ")}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Resultado">
              <div style={S.segCtrl}>
                {(ACCIONES[logForm.accion]?.resultados||[]).map(r => <button key={r} style={{...S.segBtn,...(logForm.resultado===r?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,resultado:r}))}>{r}</button>)}
              </div>
            </Field>
            {requiereJugador && (
              <Field label={<span>Jugador <span style={{color:"#ff6b6b"}}>*</span></span>}>
                {match.players.filter(p => p.name).length === 0
                  ? <div style={S.jugadorWarning}>⚠️ Cargá los nombres en la pestaña Jugadores primero.</div>
                  : <select style={{...S.input, borderColor: !logForm.jugador ? "#ff6b6b88" : "#1e3a1e"}} value={logForm.jugador} onChange={e => setLogForm(f=>({...f, jugador: e.target.value}))}>
                      <option value="">— Seleccioná un jugador —</option>
                      {match.players.filter(p => p.name).map(p => <option key={p.id} value={`${p.id} - ${p.name}`}>#{p.id} {p.name} · {p.position}</option>)}
                    </select>
                }
              </Field>
            )}
            <div style={S.logFormRow}>
              <Field label="Penalización" style={{flex:1}}><input style={S.input} placeholder="Opcional" value={logForm.penalizacion} onChange={e=>setLogForm(f=>({...f,penalizacion:e.target.value}))}/></Field>
              <Field label="Tarjeta">
                <div style={S.segCtrl}>
                  {["—","Amarilla","Roja"].map(t => <button key={t} style={{...S.segBtn,...(logForm.tarjeta===(t==="—"?"":t)?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,tarjeta:t==="—"?"":t}))}>{t}</button>)}
                </div>
              </Field>
            </div>
            <Field label="Observaciones"><input style={S.input} placeholder="Opcional" value={logForm.obs} onChange={e=>setLogForm(f=>({...f,obs:e.target.value}))}/></Field>
            <button style={{...S.addBtn, ...(requiereJugador && !logForm.jugador ? S.addBtnDisabled : {})}} onClick={addLog}>
              {requiereJugador && !logForm.jugador ? "Seleccioná un jugador para continuar" : "+ Agregar acción"}
            </button>
          </div>
          {match.log.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={S.logHeader}>
                <span style={{flex:.4}}>Min</span><span style={{flex:.4}}>T</span><span style={{flex:.8}}>Equipo</span>
                <span style={{flex:1.2}}>Acción</span><span style={{flex:1.8}}>Resultado / Jugador</span><span style={{flex:.3}}></span>
              </div>
              {[...match.log].reverse().map(e => (
                <div key={e.id} style={{...S.logRow, borderLeft:`3px solid ${e.equipo==="Propio"?"#00e5a0":"#ff6b6b"}`}}>
                  <span style={{flex:.4,color:"#888",fontSize:12}}>{e.minuto||"—"}</span>
                  <span style={{flex:.4}}><span style={S.badge}>{e.tiempo}</span></span>
                  <span style={{flex:.8,color:e.equipo==="Propio"?"#00e5a0":"#ff6b6b",fontSize:12,fontWeight:600}}>{e.equipo}</span>
                  <span style={{flex:1.2,fontSize:13}}>{ACCIONES[e.accion]?.icon} {e.accion.replace("_"," ")}</span>
                  <span style={{flex:1.8,fontSize:12,color:"#ccc"}}>
                    {e.resultado}
                    {e.jugador ? <span style={{color:"#f5c842"}}> · {e.jugador}</span> : ""}
                    {e.tarjeta ? ` · 🟡${e.tarjeta}` : ""}
                  </span>
                  <span style={{flex:.3,textAlign:"right"}}><button style={S.delBtn} onClick={()=>removeLog(e.id)}>✕</button></span>
                </div>
              ))}
            </div>
          )}
          {match.log.length === 0 && <div style={S.empty}>Todavía no hay acciones registradas.</div>}
        </div>
      )}

      {section === 2 && (
        <div style={S.page}>
          {selPlayer === null ? (
            <>
              <div style={S.pageTitle}>Plantel (23 jugadores)</div>
              <div style={S.playerList}>
                {match.players.map(p => (
                  <div key={p.id} style={S.playerRow} onClick={()=>setSelPlayer(p.id)}>
                    <div style={S.playerNumBadge}>{p.id}</div>
                    <div style={S.playerRowInfo}>
                      <input style={S.playerNameInput} placeholder="Nombre del jugador" value={p.name} onClick={e=>e.stopPropagation()} onChange={e=>updatePlayer(p.id,"name",e.target.value)}/>
                      <span style={S.playerPosLabel}>{p.position}</span>
                    </div>
                    {calcPts(p) > 0 && <div style={S.playerPtsBadge}>{calcPts(p)} pts</div>}
                    <div style={S.playerArrow}>›</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <PlayerEditor p={selPlayerData} update={(k,v)=>updatePlayer(selPlayerData.id,k,v)} onBack={()=>setSelPlayer(null)} onPrev={()=>setSelPlayer(v=>Math.max(1,v-1))} onNext={()=>setSelPlayer(v=>Math.min(23,v+1))}/>
          )}
        </div>
      )}

      {section === 3 && (
        <div style={S.page}>
          <div style={S.pageTitle}>Resumen del Partido</div>
          <div style={S.resScorebig}>
            <div style={S.resTeam}><div style={S.resTeamName}>Propio</div><div style={S.resScoreNum}>{match.score.us}</div></div>
            <div style={S.resMid}><div style={S.resDash}>—</div>{match.rival&&<div style={S.resRivalName}>{match.rival}</div>}</div>
            <div style={S.resTeam}><div style={S.resTeamName}>{match.rival||"Rival"}</div><div style={{...S.resScoreNum,color:"#fff"}}>{match.score.them}</div></div>
          </div>
          <div style={S.nav}>
            {[["total","Todo el partido"],["1T","Primer Tiempo"],["2T","Segundo Tiempo"]].map(([k,l])=>(
              <button key={k} style={{...S.navBtn,...(resTab===k?S.navBtnActive:{})}} onClick={()=>setResTab(k)}>{l}</button>
            ))}
          </div>
          <div style={{...S.summCard,marginTop:16}}>
            <div style={S.summCardTitle}>Análisis Táctico</div>
            <div style={S.summHead}>
              <span style={{flex:1.8}}>Estadística</span>
              <span style={{flex:.6,textAlign:"center",color:"#00e5a0"}}>Propio</span>
              <span style={{flex:1.6,textAlign:"center"}}>Efectividad</span>
              <span style={{flex:.6,textAlign:"center",color:"#ff6b6b"}}>Rival</span>
            </div>
            {activeSummary.map((row,i) => {
              const total = row.propio + row.rival;
              const propPct = total === 0 ? 0 : Math.round((row.propio/total)*100);
              return (
                <div key={i} style={{...S.summRow,...(i%2===0?S.summRowAlt:{})}}>
                  <span style={{flex:1.8,fontSize:13}}>{row.label}</span>
                  <span style={{flex:.6,textAlign:"center",fontWeight:700,color:"#00e5a0"}}>{row.propio}</span>
                  <span style={{flex:1.6}}>
                    {total > 0 ? (
                      <div style={S.barWrap}>
                        <div style={{...S.barFill, width:`${propPct}%`, background: row.type==="neg"?"#ff6b6b":row.type==="pos"?"#00e5a0":"#888"}}/>
                        <span style={S.barLabel}>{propPct}%</span>
                      </div>
                    ) : <span style={{color:"#444",fontSize:12,paddingLeft:8}}>Sin datos</span>}
                  </span>
                  <span style={{flex:.6,textAlign:"center",fontWeight:700,color:"#ff6b6b"}}>{row.rival}</span>
                </div>
              );
            })}
          </div>
          <div style={{...S.summCard,marginTop:16}}>
            <div style={S.summCardTitle}>Puntos por Jugador</div>
            <div style={S.summHead}>
              <span style={{flex:2}}>Jugador</span>
              <span style={{flex:.7,textAlign:"center"}}>T</span><span style={{flex:.7,textAlign:"center"}}>C</span>
              <span style={{flex:.7,textAlign:"center"}}>P</span><span style={{flex:.7,textAlign:"center"}}>D</span>
              <span style={{flex:.8,textAlign:"center",color:"#f5c842"}}>Pts</span>
              <span style={{flex:.7,textAlign:"center"}}>Min</span>
            </div>
            {match.players.filter(p=>p.name||calcPts(p)>0).map((p,i)=>(
              <div key={p.id} style={{...S.summRow,...(i%2===0?S.summRowAlt:{})}}>
                <span style={{flex:2,fontSize:13}}>#{p.id} {p.name||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.tries||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.conversions||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.penalties||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.dropGoals||"—"}</span>
                <span style={{flex:.8,textAlign:"center",fontWeight:700,color:"#f5c842"}}>{calcPts(p)||"—"}</span>
                <span style={{flex:.7,textAlign:"center",color:"#888",fontSize:12}}>{p.minutesPlayed}'</span>
              </div>
            ))}
            {match.players.filter(p=>p.name||calcPts(p)>0).length===0 && <div style={S.empty}>Cargá los jugadores en la pestaña Jugadores.</div>}
          </div>
          {match.notes && <div style={S.notesBox}><strong>Notas:</strong> {match.notes}</div>}
          <button style={S.exportBtn} onClick={() => exportMatchPDF(match)}>📄 Exportar PDF</button>
          <button style={{...S.saveBtn, opacity: saving?0.7:1}} onClick={saveMatch} disabled={saving}>
            {saving ? "Guardando..." : editingId ? "💾 Guardar cambios" : "💾 Guardar Partido"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Header({ children, user }) {
  return (
    <header style={S.header}>
      <div style={S.headerInner}>
        <div style={S.logo}>
          <span style={{fontSize:22}}>🏉</span>
          <span style={S.logoTxt}>RUGBY<span style={S.logoAcc}>STATS</span></span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {children}
          <button style={S.pillRed} onClick={() => signOut(auth)}>Salir</button>
        </div>
      </div>
    </header>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{display:"flex",flexDirection:"column",gap:6,fontSize:11,color:"#7a8a7a",textTransform:"uppercase",letterSpacing:1,...style}}>
      {label}{children}
    </label>
  );
}

function PlayerEditor({ p, update, onBack, onPrev, onNext }) {
  return (
    <div>
      <div style={S.pedHeader}>
        <button style={S.backBtn} onClick={onBack}>← Plantel</button>
        <div><div style={S.pedName}>#{p.id} {p.name||"Sin nombre"}</div><div style={S.pedPos}>{p.position}</div></div>
        <div style={S.pedPts}>{calcPts(p)}<span style={{fontSize:12,color:"#888"}}> pts</span></div>
      </div>
      <div style={S.statsGrid}>
        {STATS_JUGADOR.map(s=>(
          <div key={s.key} style={S.statCard}>
            <div style={S.statIcon}>{s.icon}</div>
            <div style={S.statLbl}>{s.label}{s.pts>0?<span style={S.statPtsHint}> +{s.pts}pts</span>:""}</div>
            <div style={S.statCtrl}>
              <button style={S.statBtn} onClick={()=>update(s.key,Math.max(0,p[s.key]-1))}>−</button>
              <span style={S.statVal}>{p[s.key]}</span>
              <button style={S.statBtn} onClick={()=>update(s.key,p[s.key]+1)}>+</button>
            </div>
          </div>
        ))}
        <div style={S.statCard}>
          <div style={S.statIcon}>⏱</div>
          <div style={S.statLbl}>Minutos jugados</div>
          <div style={S.statCtrl}>
            <button style={S.statBtn} onClick={()=>update("minutesPlayed",Math.max(0,p.minutesPlayed-5))}>−5</button>
            <span style={S.statVal}>{p.minutesPlayed}'</span>
            <button style={S.statBtn} onClick={()=>update("minutesPlayed",Math.min(80,p.minutesPlayed+5))}>+5</button>
          </div>
        </div>
      </div>
      <div style={S.pedNav}>
        <button style={S.pedNavBtn} disabled={p.id===1} onClick={onPrev}>← Anterior</button>
        <button style={S.pedNavBtn} disabled={p.id===23} onClick={onNext}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const S = {
  root: { minHeight:"100vh", background:"#0b0f0b", color:"#e8f0e8", fontFamily:"'Georgia', 'Times New Roman', serif" },
  loginRoot: { minHeight:"100vh", background:"#0b0f0b", display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  loginCard: { background:"#0f180f", border:"1px solid #1e3a1e", borderRadius:16, padding:"40px 32px", width:"100%", maxWidth:380 },
  loginLogo: { display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginBottom:32 },
  loginTitle: { fontSize:28, fontWeight:"bold", letterSpacing:4, color:"#e8f0e8" },
  loginAccent: { color:"#00e5a0" },
  loginSubtitle: { fontSize:12, color:"#4a6a4a", letterSpacing:2, textTransform:"uppercase" },
  loginForm: { display:"flex", flexDirection:"column", gap:16 },
  loginLabel: { display:"flex", flexDirection:"column", gap:6, fontSize:11, color:"#7a8a7a", textTransform:"uppercase", letterSpacing:1 },
  loginInput: { background:"#0d150d", border:"1px solid #1e3a1e", borderRadius:8, padding:"12px 14px", color:"#e8f0e8", fontSize:14, fontFamily:"inherit", outline:"none" },
  loginBtn: { background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:10, padding:"14px", fontSize:15, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginTop:8 },
  loginError: { background:"#2a1a1a", border:"1px solid #ff6b6b44", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#ff9a9a" },
  toast: { position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:999, padding:"12px 24px", borderRadius:10, fontSize:14, fontWeight:"bold", color:"#fff", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" },
  header: { position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(11,15,11,0.97)", borderBottom:"1.5px solid #1e3a1e", backdropFilter:"blur(12px)" },
  headerInner: { maxWidth:860, margin:"0 auto", padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  logo: { display:"flex", alignItems:"center", gap:8 },
  logoTxt: { fontSize:19, fontWeight:"bold", letterSpacing:4, color:"#e8f0e8" },
  logoAcc: { color:"#00e5a0" },
  pill: { background:"transparent", border:"1px solid #2a4a2a", color:"#aaa", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  pillGreen: { background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontWeight:"bold", fontSize:12, fontFamily:"inherit" },
  pillRed: { background:"transparent", border:"1px solid #4a2a2a", color:"#ff6b6b", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  editingBanner: { maxWidth:860, margin:"8px auto 0", padding:"8px 16px", background:"#1a2a0a", border:"1px solid #4a7a1a", borderRadius:8, fontSize:12, color:"#aadd44", textAlign:"center" },
  scoreboard: { maxWidth:860, margin:"72px auto 0", padding:"20px 16px 0", display:"flex", alignItems:"center", gap:8 },
  scoreTeam: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8 },
  scoreLabel: { fontSize:11, color:"#6a8a6a", textTransform:"uppercase", letterSpacing:1.5, textAlign:"center" },
  scoreCtrl: { display:"flex", alignItems:"center", gap:10 },
  scoreBtn: { background:"#111d11", border:"1px solid #00e5a0", color:"#00e5a0", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:20, lineHeight:1 },
  scoreNum: { fontSize:52, fontWeight:"bold", color:"#fff", minWidth:64, textAlign:"center", lineHeight:1 },
  scoreInput: { fontSize:46, fontWeight:"bold", color:"#fff", width:72, textAlign:"center", background:"transparent", border:"none", borderBottom:"2px solid #00e5a080", outline:"none", fontFamily:"'Georgia','Times New Roman',serif", MozAppearance:"textfield" },
  scoreCenter: { display:"flex", flexDirection:"column", alignItems:"center", gap:2, paddingBottom:4 },
  scoreVS: { fontSize:13, color:"#00e5a0", fontWeight:"bold", letterSpacing:3 },
  scoreInfo: { fontSize:11, color:"#4a6a4a" },
  scoreInfo2: { fontSize:12, color:"#7aaa7a", fontWeight:"bold" },
  nav: { maxWidth:860, margin:"16px auto 0", padding:"4px", display:"flex", gap:4, background:"#111811", borderRadius:12 },
  navBtn: { flex:1, padding:"9px 4px", background:"transparent", border:"none", color:"#6a8a6a", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12, transition:"all .15s" },
  navBtnActive: { background:"#00e5a0", color:"#0b0f0b", fontWeight:"bold" },
  page: { maxWidth:860, margin:"16px auto 40px", padding:"0 16px" },
  pageTitle: { fontSize:13, color:"#00e5a0", textTransform:"uppercase", letterSpacing:3, marginBottom:16, fontWeight:"bold" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  input: { background:"#0d150d", border:"1px solid #1e3a1e", borderRadius:8, padding:"10px 12px", color:"#e8f0e8", fontSize:13, fontFamily:"inherit", outline:"none" },
  logForm: { background:"#0f180f", border:"1px solid #1e3a1e", borderRadius:14, padding:"16px" },
  logFormRow: { display:"flex", gap:10, alignItems:"flex-end", marginBottom:12 },
  segCtrl: { display:"flex", gap:3, flexWrap:"wrap" },
  segBtn: { background:"#111d11", border:"1px solid #1e3a1e", color:"#7a9a7a", borderRadius:6, padding:"8px 12px", cursor:"pointer", fontFamily:"inherit", fontSize:12, whiteSpace:"nowrap" },
  segBtnActive: { background:"#00e5a0", color:"#0b0f0b", border:"1px solid #00e5a0", fontWeight:"bold" },
  accionGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 },
  accionBtn: { background:"#111d11", border:"1px solid #1e3a1e", color:"#7a9a7a", borderRadius:8, padding:"10px 4px", cursor:"pointer", fontFamily:"inherit", fontSize:12, display:"flex", flexDirection:"column", alignItems:"center", gap:2 },
  accionBtnActive: { background:"#0d2a1d", border:"1px solid #00e5a0", color:"#00e5a0" },
  addBtn: { width:"100%", background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:10, padding:"13px", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginTop:12 },
  addBtnDisabled: { background:"#1a2a1a", color:"#4a6a4a", cursor:"not-allowed" },
  jugadorWarning: { background:"#2a1a0e", border:"1px solid #ff6b6b55", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#ff9a6b" },
  logHeader: { display:"flex", padding:"8px 12px", fontSize:11, color:"#4a6a4a", textTransform:"uppercase", letterSpacing:1, borderBottom:"1px solid #1e3a1e" },
  logRow: { display:"flex", alignItems:"center", padding:"10px 12px", borderBottom:"1px solid #131f13", fontSize:13 },
  badge: { background:"#1a2a1a", color:"#7aaa7a", fontSize:10, padding:"2px 6px", borderRadius:4, fontWeight:"bold" },
  delBtn: { background:"transparent", border:"none", color:"#4a3a3a", cursor:"pointer", fontSize:13, padding:4 },
  playerList: { display:"flex", flexDirection:"column", gap:6 },
  playerRow: { display:"flex", alignItems:"center", gap:10, background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:10, padding:"10px 14px", cursor:"pointer" },
  playerNumBadge: { width:28, height:28, background:"#1a2a1a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold", color:"#00e5a0", flexShrink:0 },
  playerRowInfo: { flex:1, display:"flex", flexDirection:"column", gap:3 },
  playerNameInput: { background:"transparent", border:"none", borderBottom:"1px solid #1e3a1e", color:"#e8f0e8", fontSize:13, fontFamily:"inherit", padding:"2px 0", outline:"none", width:"100%" },
  playerPosLabel: { fontSize:11, color:"#4a6a4a" },
  playerPtsBadge: { fontSize:12, color:"#f5c842", fontWeight:"bold" },
  playerArrow: { color:"#3a5a3a", fontSize:18, marginLeft:4 },
  pedHeader: { display:"flex", alignItems:"center", gap:12, background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:12, padding:"14px 16px", marginBottom:16 },
  backBtn: { background:"transparent", border:"none", color:"#00e5a0", cursor:"pointer", fontSize:13, fontFamily:"inherit", whiteSpace:"nowrap" },
  pedName: { fontSize:17, fontWeight:"bold" },
  pedPos: { fontSize:11, color:"#4a6a4a" },
  pedPts: { marginLeft:"auto", fontSize:30, fontWeight:"bold", color:"#f5c842" },
  statsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  statCard: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:10, padding:"12px" },
  statIcon: { fontSize:18, marginBottom:4 },
  statLbl: { fontSize:11, color:"#6a8a6a", marginBottom:8 },
  statPtsHint: { color:"#f5c842" },
  statCtrl: { display:"flex", alignItems:"center", gap:8, justifyContent:"center" },
  statBtn: { background:"#1a2a1a", border:"1px solid #2a4a2a", color:"#00e5a0", borderRadius:6, width:32, height:32, cursor:"pointer", fontSize:16 },
  statVal: { fontSize:22, fontWeight:"bold", minWidth:32, textAlign:"center" },
  pedNav: { display:"flex", justifyContent:"space-between", marginTop:14 },
  pedNavBtn: { background:"#0f180f", border:"1px solid #1e3a1e", color:"#00e5a0", borderRadius:8, padding:"9px 18px", cursor:"pointer", fontFamily:"inherit", fontSize:12 },
  resScorebig: { display:"flex", alignItems:"center", justifyContent:"center", gap:20, marginBottom:20, background:"#0f180f", borderRadius:14, padding:"20px" },
  resTeam: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 },
  resTeamName: { fontSize:11, color:"#6a8a6a", textTransform:"uppercase", letterSpacing:1 },
  resScoreNum: { fontSize:52, fontWeight:"bold", color:"#00e5a0" },
  resMid: { display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  resDash: { fontSize:32, color:"#2a4a2a" },
  resRivalName: { fontSize:12, color:"#6a8a6a" },
  summCard: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:12, overflow:"hidden" },
  summCardTitle: { padding:"12px 16px", fontSize:11, color:"#00e5a0", textTransform:"uppercase", letterSpacing:2, borderBottom:"1px solid #1a2a1a", fontWeight:"bold" },
  summHead: { display:"flex", padding:"8px 16px", fontSize:10, color:"#4a6a4a", textTransform:"uppercase", letterSpacing:.5, borderBottom:"1px solid #1a2a1a" },
  summRow: { display:"flex", alignItems:"center", padding:"9px 16px", fontSize:13, borderBottom:"1px solid #111811" },
  summRowAlt: { background:"#0d150d" },
  barWrap: { height:16, background:"#111811", borderRadius:8, overflow:"hidden", position:"relative", flex:1, margin:"0 4px" },
  barFill: { height:"100%", borderRadius:8, transition:"width .4s ease" },
  barLabel: { position:"absolute", right:6, top:0, bottom:0, display:"flex", alignItems:"center", fontSize:10, color:"#fff", fontWeight:"bold" },
  notesBox: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#aaa", margin:"12px 0" },
  exportBtn: { width:"100%", background:"transparent", border:"1px solid #00e5a0", color:"#00e5a0", borderRadius:10, padding:"12px", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginTop:8, marginBottom:6 },
  saveBtn: { width:"100%", background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:10, padding:"14px", fontSize:15, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginTop:8 },
  empty: { textAlign:"center", color:"#3a5a3a", padding:"32px 16px", fontSize:14 },
  histCard: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:12, padding:"16px", marginBottom:10 },
  histTop: { display:"flex", justifyContent:"space-between", marginBottom:8 },
  histRival: { fontSize:15, fontWeight:"bold" },
  histDate: { fontSize:12, color:"#4a6a4a" },
  histScoreRow: { display:"flex", alignItems:"center", gap:12, marginBottom:6 },
  histScore: { fontSize:32, fontWeight:"bold", color:"#00e5a0" },
  histDash: { fontSize:20, color:"#2a4a2a" },
  histMeta: { fontSize:12, color:"#4a6a4a" },
  histActions: { display:"flex", gap:8, marginTop:12 },
  histBtnEdit: { flex:1, background:"#1a2a1a", border:"1px solid #2a4a2a", color:"#00e5a0", borderRadius:8, padding:"9px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" },
  histBtnDelete: { flex:1, background:"#2a1a1a", border:"1px solid #4a2a2a", color:"#ff6b6b", borderRadius:8, padding:"9px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" },
  histConfirm: { marginTop:12, background:"#1a0f0f", border:"1px solid #ff6b6b44", borderRadius:8, padding:"12px" },
  histConfirmText: { fontSize:13, color:"#ffaaaa" },
  histBtnDanger: { background:"#ff6b6b", border:"none", color:"#fff", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" },
  histBtnCancel: { background:"#1a2a1a", border:"1px solid #2a4a2a", color:"#aaa", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:13 },
};
