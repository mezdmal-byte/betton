"""Explicit release-only server: no database, bot, workers or schema imports.
Never enabled by the normal app lifecycle. Deployment requires owner approval.
"""
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.middleware('http')
async def maintenance(request: Request, call_next):
    if request.method == 'GET' and request.url.path == '/health':
        return JSONResponse({'status':'maintenance','writes_enabled':False})
    return JSONResponse(status_code=503,
                        content={'detail':'Обновление BetTON. Повторите позже.'},
                        headers={'Retry-After':'60','Cache-Control':'no-store'})


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app,host='0.0.0.0',port=int(os.environ.get('PORT','10000')))
