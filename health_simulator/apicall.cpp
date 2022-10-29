#include "apicall.h"

#include <QNetworkAccessManager>

ApiCall::ApiCall()
{
    restclient = new QNetworkAccessManager();
    url.setScheme("https");
    url.setHost("stratathonapi.tanmoy.codes");
}

void ApiCall::logdata(QString data){
    url.setPath("/device/log");
    QNetworkRequest request ;
    request.setUrl(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "text/plain");
    restclient->post(request, data.toUtf8());
}

void ApiCall::sendSOS(QString hardwareId){
   QString route = "/device/sos/"+hardwareId;
   url.setPath(route);
   QNetworkRequest request ;
   request.setUrl(url);
   request.setHeader(QNetworkRequest::ContentTypeHeader, "text/plain");
   restclient->get(request);
}
