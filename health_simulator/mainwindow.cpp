#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "chart.h"
#include <QTime>
#include <QtMath>
#include <QMovie>
#include <QtCharts/QChartView>
#include <QtWidgets/QApplication>
#include <QtWidgets/QMainWindow>
#include <QMessageBox>


MainWindow::MainWindow(QWidget *parent): QMainWindow(parent), ui(new Ui::MainWindow)
{

    ui->setupUi(this);
    init();
}

void MainWindow::init(){
    hrChart = new Chart;
//    ecgChart = new Chart;

    hrChart->setXRange(0, 30);
    hrChart->setYRange(0, 150);


    QChartView hrChartView(hrChart);
//    QChartView ecgChartView(ecgChart);

    hrChartView.setRenderHint(QPainter::Antialiasing);
//    ecgChartView.setRenderHint(QPainter::Antialiasing);

    ui->chartView1->setChart(hrChart);
//    ui->chartView2->setChart(ecgChart);


    // Setup walking gif
    QMovie *movie = new QMovie("./walking.gif");
    movie->setScaledSize(QSize(81,81));
    ui->running_label->setMovie(movie);
    ui->running_label->setScaledContents(true);
    ui->running_label->setSizePolicy( QSizePolicy::Ignored, QSizePolicy::Ignored );
    movie->start();
    movie->stop();

    // Setup sleeping icon
    QPixmap pixmap("./not_sleeping.png");
    ui->sleeping_label->setPixmap(pixmap);
    ui->sleeping_label->setMask(pixmap.mask());

    // Set some default value
    ui->temperatureTextEdit->setValue(temperature);
    ui->spo2TextEdit->setValue(spo2);

    refreshUIWithLatestData();

}



MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::delay(int n) {
    QTime dieTime= QTime::currentTime().addMSecs(n);
    while (QTime::currentTime() < dieTime)
    QCoreApplication::processEvents(QEventLoop::AllEvents, 100);
}

void MainWindow::on_toggle_running_clicked()
{
    isRunning = !isRunning;
    if(isRunning){
        ui->running_label->movie()->start();
        if(isSleeping){
            on_toggle_sleeping_clicked();
        }
    }else{
        ui->running_label->movie()->stop();
    }
}


void MainWindow::on_toggle_sleeping_clicked()
{
    isSleeping = !isSleeping;
    if(isSleeping){
        QPixmap pixmap("./sleeping.png");
        ui->sleeping_label->setPixmap(pixmap);
        ui->sleeping_label->setMask(pixmap.mask());
        ui->sleeping_label->show();

        if(isRunning){
            on_toggle_running_clicked();
        }
    }else{
        QPixmap pixmap("./not_sleeping.png");
        ui->sleeping_label->setPixmap(pixmap);
        ui->sleeping_label->setMask(pixmap.mask());
        ui->sleeping_label->show();
    }
}

void MainWindow::refreshUIWithLatestData(){
    ui->sleep_label->setText(QString::number(sleep));
    ui->temperature_label->setText(QString::number(temperature));
    ui->heart_rate_label->setText(QString::number(hr));
    ui->spo2_label->setText(QString::number(spo2));
    ui->calorie_label->setText(QString::number(calories_burned));
    ui->steps_walked_label->setText(QString::number(steps_walked));

    ui->hr_value->setText(QString::number(hr));
}

void MainWindow::simulate()
{
    if(!isSimulationRunning) return;
    count = count+1;

    // HR
    if(isRunning){
        hr = getRandom(90,93);
    }else if(isSleeping){
        hr = getRandom(45, 50);
    }else{
        hr = getRandom(70, 75);
    }

    if(isAnomalyInHR){
        hr = getRandom(100,110);
    }

    // Calorie & steps walked
    if(isRunning){
        steps_walked = steps_walked + getRandom(150,200);
        calories_burned = calories_burned + getRandom(9,12);
    }

    // Sleeping
    if(isSleeping){
        sleep = sleep + 1;
    }

    hrChart->addPoint(count, hr);
    refreshUIWithLatestData();
    // Build data string to send
    QString dataToSend  = "";

    if(hr != 0) dataToSend = dataToSend + QString::number(hr);
    else dataToSend = dataToSend + QString::number(-1);

    dataToSend = dataToSend + "|";

    if(hrv != 0) dataToSend = dataToSend + QString::number(hrv);
    else dataToSend = dataToSend + QString::number(-1);

    dataToSend = dataToSend + "|";

    if(spo2 != 0) dataToSend = dataToSend + QString::number(spo2);
    else dataToSend = dataToSend + QString::number(-1);

    dataToSend = dataToSend + "|";

    if(temperature != 0) dataToSend = dataToSend + QString::number(temperature);
    else dataToSend = dataToSend + QString::number(-1);

    dataToSend = dataToSend + "|";

    if(steps_walked != 0) dataToSend = dataToSend + QString::number(steps_walked);
    else dataToSend = dataToSend + QString::number(-1);

    dataToSend = dataToSend + "|";

    if(sleep != 0) dataToSend = dataToSend + QString::number(sleep);
    else dataToSend = dataToSend + QString::number(-1);

    dataToSend = dataToSend + "|";

    if(calories_burned != 0) dataToSend = dataToSend + QString::number(calories_burned);
    else dataToSend = dataToSend + QString::number(-1);

    dataToSend = dataToSend + "|";

    dataToSend = dataToSend + QString::number(QDateTime::currentMSecsSinceEpoch());

    bufferredData.push_back(dataToSend);

    sleep = 0;
    steps_walked = 0;
    calories_burned = 0;


    uploadLogToServer();
    delay(1000);
    simulate();
}


double MainWindow::getRandom(int min, int max){
    return rand() % ((max + 1) - min) + min;
}

void MainWindow::on_temperatureTextEdit_valueChanged(double arg1)
{
    temperature=arg1;
    refreshUIWithLatestData();
}


void MainWindow::on_spo2TextEdit_valueChanged(double arg1)
{
    spo2=arg1;
    refreshUIWithLatestData();
}


void MainWindow::on_startSimulationBtn_clicked()
{
    isSimulationRunning = !isSimulationRunning;
    if(isSimulationRunning){
        ui->startSimulationBtn->setText("Stop Simulation");
        ui->startSimulationBtn->setStyleSheet("border-radius: 6px; font-size: 18px;background-color: rgb(255, 255, 255);border: 3px solid rgb(0, 255, 0)");
        simulate();
    }else{
        ui->startSimulationBtn->setText("Start Simulation");
        ui->startSimulationBtn->setStyleSheet("border-radius: 6px;font-size: 18px;background-color: rgb(255, 255, 255);border: 3px solid rgb(237, 212, 0)");
    }
}


void MainWindow::on_checkBox_stateChanged(int arg1)
{
    if(arg1 != 0) isAnomalyInHR = true;
    else isAnomalyInHR = false;
}


void MainWindow::uploadLogToServer(){
    if(bufferredData.size() < getRandom(10, 20)) return;
    ui->server_sent_status->setText("Sending ....");
    QString data = ui->hardware_id->toPlainText();
    data = data + "\n";
    for (auto& it : bufferredData) {
        data = data + it + "\n";
    }
    apicall.logdata(data);
    ui->server_sent_status->setText("Sent");
    ui->last_sent_data_timestamp->setText(QDateTime::currentDateTime().toString());
    bufferredData.clear();
}

void MainWindow::on_sendsos_clicked()
{
    QMessageBox::information(this, tr("SOS Sent"), tr("Emergency contacts will be alerted via sms/email notifications soon"));
    apicall.sendSOS(ui->hardware_id->toPlainText());
}

