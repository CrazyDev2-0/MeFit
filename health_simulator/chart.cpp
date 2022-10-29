// Copyright (C) 2016 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR GPL-3.0-only

#include "chart.h"
#include <QtCharts/QAbstractAxis>
#include <QtCharts/QSplineSeries>
#include <QtCharts/QValueAxis>
#include <QtCore/QRandomGenerator>

Chart::Chart(QGraphicsItem *parent, Qt::WindowFlags wFlags): QChart(QChart::ChartTypeCartesian, parent, wFlags),m_series(0),m_axisX(new QValueAxis()),m_axisY(new QValueAxis())
{

    QPen red(Qt::red);
    red.setWidth(2);

    this->createDefaultAxes();
    this->legend()->hide();
    this->setAnimationOptions(QChart::AllAnimations);

    m_series = new QSplineSeries(this);
    m_series->setPen(red);
    addSeries(m_series);

//    m_axisX->hide();
//    m_axisY->hide();

    m_axisX->setTickCount(5);
    m_axisY->setTickCount(5);


    m_axisX->setLabelFormat("%d");
    m_axisY->setLabelFormat("%d");

//    m_axisX->setLabelsVisible(false);

    addAxis(m_axisX,Qt::AlignBottom);
    addAxis(m_axisY,Qt::AlignLeft);

    m_series->attachAxis(m_axisX);
    m_series->attachAxis(m_axisY);

}

Chart::~Chart(){

}

void Chart::setXRange(qreal min, qreal max){
    m_axisX->setRange(min, max);
}

void Chart::setYRange(qreal min, qreal max){
    m_axisY->setRange(min, max);
}

void Chart::addPoint(qreal x, qreal y)
{
    m_series->append(x, y);
    if(x > 20)
     scroll(this->geometry().width()/38, 0);
}
