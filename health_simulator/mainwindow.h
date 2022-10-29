#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include "chart.h"
#include "apicall.h"

QT_BEGIN_NAMESPACE
namespace Ui { class MainWindow; }
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    Chart *hrChart;
    Chart *ecgChart;
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();
    double getRandom(int min, int max);

private slots:
    void on_toggle_running_clicked();

    void on_toggle_sleeping_clicked();

    void on_temperatureTextEdit_valueChanged(double arg1);

    void on_spo2TextEdit_valueChanged(double arg1);

    void on_startSimulationBtn_clicked();

    void on_checkBox_stateChanged(int arg1);

    void on_sendsos_clicked();

private:
    Ui::MainWindow *ui;
    bool isRunning = false;
    bool isSleeping = false;
    bool isSimulationRunning = false;
    bool isAnomalyInHR = false;
//    hr|hrv|ecg_reading|spo2|temperature|steps_walked|sleep|calories_burned|timestamp
    double hr = 0;
    double hrv = 0;
    double ecg_reading = 0;
    double spo2 = 97;
    double temperature = 99;
    int steps_walked = 0;
    double sleep = 0;
    double calories_burned = 0;

    int count = 0;

    // Store logs
    std::vector<QString> bufferredData;

    // Api clienty
    ApiCall apicall;

    void init();
    void simulate();
    void delay(int);
    void refreshUIWithLatestData();
    void uploadLogToServer();
};
#endif // MAINWINDOW_H
