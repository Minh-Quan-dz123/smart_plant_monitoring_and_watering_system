package com.example.project_iot_auto_watering.ui.home

import android.app.Dialog
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.fragment.app.DialogFragment

import com.example.project_iot_auto_watering.databinding.FragmentDialogAddCropsBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder

class FragmentDialogCrops(
    private val listener: OnClickDialog
) : DialogFragment() {
    private var _binding: FragmentDialogAddCropsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        _binding = FragmentDialogAddCropsBinding.inflate(layoutInflater)
        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(binding.root)
            .create()

//        val metrics = resources.displayMetrics
//        val width = (metrics.widthPixels * 0.95).toInt()

        dialog.window?.setLayout( ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)

        binding.imgClose.setOnClickListener {
            dismiss()
        }

        binding.imgAdd.setOnClickListener {
            listener.onClickIconAdd()
        }

        initAdapterListCrops()

        return dialog
    }


    private fun initAdapterListCrops() {
        val listCrops = listOf("Tomato", "Apple", "Orange")
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, listCrops)

        binding.rcvListCrops.adapter = adapter
    }
}

interface OnClickDialog {
    fun onClickIconAdd()
}