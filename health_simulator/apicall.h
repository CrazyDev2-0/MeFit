#ifndef APICALL_H
#define APICALL_H

#include <QNetworkAccessManager>


class ApiCall
{

public:
    ApiCall();
    void logdata(QString data);
    void sendSOS(QString hardwareId);
private:
    QNetworkAccessManager *restclient;
    QUrl url;


};

#endif // APICALL_H
