import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:optum_hackathon/presentation/pages/deviceLinkProcess.dart';

class DeviceLinkScreen extends StatefulWidget {
  const DeviceLinkScreen({Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _DeviceLinkScreenState();
}

class _DeviceLinkScreenState extends State<DeviceLinkScreen> {
  Barcode? result;
  MobileScannerController? qr_controller = MobileScannerController();
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  bool isTorchOn = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: SafeArea(
          child: Stack(
            alignment: Alignment.center,
            children: [
              _buildQrView(context),
              Positioned(
                  top: 25,
                  left: 20,
                  child: IconButton(
                      onPressed: () async {
                        Get.back();
                      },
                      icon: const Icon(
                        Icons.arrow_back,
                        color: Colors.white,
                      )
                  )
              ),
              Positioned(
                  top: 25,
                  right: 20,
                  child: IconButton(
                      onPressed: () async {
                        await qr_controller?.toggleTorch();
                        setState(() {
                          isTorchOn = !isTorchOn;
                        });
                      },
                      icon: Icon(
                        isTorchOn
                            ? Icons.flashlight_on_outlined
                            : Icons.flashlight_off_outlined,
                        color: Colors.white,
                  )
                )
              ),
        ],
      ),
    ));
  }

  Widget _buildQrView(BuildContext context) {
    return MobileScanner(
      key: qrKey,
      controller: qr_controller,
      onDetect: (barcode, args) {
        if(barcode.rawValue == null) return;
        Get.off(()=>DeviceLinkProcess(hardwareId: barcode.rawValue??""));
      },
    );
  }

  @override
  void dispose() {
    qr_controller?.dispose();
    super.dispose();
  }
}
